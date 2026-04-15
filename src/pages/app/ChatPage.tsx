import { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Send, Square, History, Plus, ChevronRight, Headset, Lock, Printer, FileDown,
  Volume2, Pause, Play, Loader2, ThumbsUp, ThumbsDown, Mic, MicOff,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import { ChatHistoryModal } from '@/components/chat/ChatHistoryModal';

interface SelectedAgent {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  tool_file_search?: boolean;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  feedback?: 'like' | 'dislike' | null;
}

type TabType = 'agente' | 'apoio';

const STORAGE_KEY = 'sb-lxteajwzovoeclbytdrp-auth-token';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lxteajwzovoeclbytdrp.supabase.co';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dGVhand6b3ZvZWNsYnl0ZHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzkxMzcsImV4cCI6MjA4ODkxNTEzN30.BLB9qSJcZMKsWhix46ASUbOW2lA0PSeyHN97jMQQGkQ';

// Suggestions removed — using placeholder text instead

async function getValidAccessToken(): Promise<string | null> {
  // Tenta pegar sessão válida via Supabase (renova automaticamente se expirada)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;
  return null;
}

// ---- TTS audio cache (in-memory per session) ----
const ttsCache = new Map<string, string>();

export default function ChatPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
  const [selectedArea, setSelectedArea] = useState<{ id: string; name: string; slug?: string } | null>(null);
  const [selectedContest, setSelectedContest] = useState<{ id: string; name: string; slug?: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('agente');

  const [agentMessages, setAgentMessages] = useState<Message[]>([]);
  const [agentConvId, setAgentConvId] = useState<string | null>(null);
  const [agentStreaming, setAgentStreaming] = useState(false);

  const [apoioMessages, setApoioMessages] = useState<Message[]>([]);
  const [apoioConvId, setApoioConvId] = useState<string | null>(null);
  const [apoioStreaming, setApoioStreaming] = useState(false);

  const [isThinking, setIsThinking] = useState(false);

  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [tokensRemaining, setTokensRemaining] = useState<number | null>(null);

  // STT state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // TTS state (global — one audio at a time)
  const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [ttsActiveMsgId, setTtsActiveMsgId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Current tab helpers
  const messages = activeTab === 'agente' ? agentMessages : apoioMessages;
  const setMessages = activeTab === 'agente' ? setAgentMessages : setApoioMessages;
  const convId = activeTab === 'agente' ? agentConvId : apoioConvId;
  const setConvId = activeTab === 'agente' ? setAgentConvId : setApoioConvId;
  const isStreaming = activeTab === 'agente' ? agentStreaming : apoioStreaming;
  const setIsStreaming = activeTab === 'agente' ? setAgentStreaming : setApoioStreaming;

  useEffect(() => {
    const savedConversationId = localStorage.getItem('selectedConversationId');
    const agent = localStorage.getItem('selectedAgent');

    // Se não tem agente nem conversa salva, redireciona
    if (!agent && !savedConversationId) {
      navigate('/app/areas');
      return;
    }

    if (agent) {
      setSelectedAgent(JSON.parse(agent));
      setSelectedArea(JSON.parse(localStorage.getItem('selectedArea') || 'null'));
      setSelectedContest(JSON.parse(localStorage.getItem('selectedContest') || 'null'));
      setSelectedSubject(JSON.parse(localStorage.getItem('selectedSubject') || 'null'));
    }

    if (savedConversationId) {
      localStorage.removeItem('selectedConversationId');
      const savedTab = localStorage.getItem('selectedTab') as TabType | null;
      localStorage.removeItem('selectedTab');

      // Buscar conversa + agente do banco para popular o estado
      const restoreFromHistory = async () => {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id, title, agent_id, agents(id, title, slug, description, icon)')
          .eq('id', savedConversationId)
          .single();

        if (conv?.agents) {
          const a = conv.agents as any;
          setSelectedAgent({ id: a.id, name: a.title, slug: a.slug, description: a.description, icon: a.icon });
          if (savedTab) setActiveTab(savedTab);
          handleRestoreConversation(savedConversationId);
        } else {
          navigate('/app/areas');
        }
      };
      restoreFromHistory();
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_token_balances')
      .select('agents_tokens_remaining')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => { if (data) setTokensRemaining(data.agents_tokens_remaining); });
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages, apoioMessages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [inputText]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const canUseAgent = useCallback((): boolean => {
    if (profile?.role === 'admin') return true;
    if (profile?.subscription_status === 'active') return true;
    if (activeTab === 'apoio') return true;
    return false;
  }, [profile, activeTab]);

  // ---- Send message ----
  const handleSend = async (overrideText?: string) => {
    const text = overrideText || inputText;
    if (!text.trim() || isStreaming) return;

    const accessToken = await getValidAccessToken();
    if (!accessToken) { toast.error('Sessão expirada. Faça login novamente.'); return; }

    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const slug = activeTab === 'agente' ? selectedAgent?.slug : 'agente-de-apoio';
    let thinkingHandled = false;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/execute-prompt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': SUPABASE_ANON,
          },
          body: JSON.stringify({ agent_slug: slug, message: userMsg.content, conversation_id: convId }),
          signal: controller.signal,
        }
      );

      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        setIsStreaming(false); setMessages(prev => prev.slice(0, -1)); return;
      }
      if (response.status === 402) {
        toast.error('Seus tokens acabaram.', { action: { label: 'Ver planos', onClick: () => navigate('/app/upgrade') } });
        setIsStreaming(false); setMessages(prev => prev.slice(0, -1)); return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const event = JSON.parse(data);
            if (event.conversation_id) {
              if (activeTab === 'agente') setAgentConvId(event.conversation_id);
              else setApoioConvId(event.conversation_id);
              if (!thinkingHandled && event.thinking === true) {
                setIsThinking(true);
                thinkingHandled = true;
              } else if (!thinkingHandled && event.thinking === false) {
                thinkingHandled = true;
              }
            }
            if (event.thinking === false && thinkingHandled) {
              setIsThinking(false);
            }
            if (event.delta) {
              setIsThinking(false);
              assistantContent += event.delta;
              const updated = assistantContent;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...copy[copy.length - 1], role: 'assistant', content: updated };
                return copy;
              });
            }
            if (event.done) {
              // Capture message IDs from the done event if available
              if (event.user_message_id || event.assistant_message_id) {
                setMessages(prev => {
                  const copy = [...prev];
                  if (event.user_message_id && copy.length >= 2) {
                    copy[copy.length - 2] = { ...copy[copy.length - 2], id: event.user_message_id };
                  }
                  if (event.assistant_message_id) {
                    copy[copy.length - 1] = { ...copy[copy.length - 1], id: event.assistant_message_id };
                  }
                  return copy;
                });
              }
              setIsStreaming(false);
              if (user) {
                supabase
                  .from('user_token_balances')
                  .select('agents_tokens_remaining')
                  .eq('user_id', user.id)
                  .single()
                  .then(({ data }) => { if (data) setTokensRemaining(data.agents_tokens_remaining); });
              }
            }
          } catch (_) {}
        }
      }
      setIsStreaming(false);
      setIsThinking(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Erro ao processar resposta. Tente novamente.');
        setMessages(prev => prev.slice(0, -1));
      }
      setIsStreaming(false);
      setIsThinking(false);
    }
  };

  const handleAbort = () => { abortControllerRef.current?.abort(); setIsStreaming(false); };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // handleChipClick removed — no more suggestion chips
  const handleNewChat = () => { setMessages([]); setConvId(null); };

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleRestoreConversation = async (conversationId: string) => {
    // Stop any existing polling
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }

    const { data: msgs } = await supabase
      .from('messages')
      .select('id, role, content, created_at, feedback')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgs) {
      setMessages(msgs as Message[]);
      setConvId(conversationId);

      // If last message is from user (no assistant response yet), start polling
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'user') {
        setIsThinking(true);
        const pollStartTime = Date.now();
        pollingRef.current = setInterval(async () => {
          // Timeout after 120 seconds
          if (Date.now() - pollStartTime > 120000) {
            setIsThinking(false);
            if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
            return;
          }

          const { data: updatedMsgs } = await supabase
            .from('messages')
            .select('id, role, content, created_at, feedback')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          if (updatedMsgs && updatedMsgs.length > 0 && updatedMsgs[updatedMsgs.length - 1].role === 'assistant') {
            setMessages(updatedMsgs as Message[]);
            setIsThinking(false);
            if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          }
        }, 3000);
      }
    }
    setHistoryOpen(false);
  };

  // ---- Feedback ----
  const handleFeedback = async (messageId: string, value: 'like' | 'dislike') => {
    const msg = messages.find(m => m.id === messageId);
    const newValue = msg?.feedback === value ? null : value;

    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, feedback: newValue } : m
    ));

    await supabase.from('messages').update({ feedback: newValue }).eq('id', messageId);
  };

  // ---- TTS ----
  const handleTTS = async (msg: Message, speed: number) => {
    if (!msg.id) return;
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) { toast.error('Sessão expirada.'); return; }

    const cacheKey = `${msg.id}_${speed}`;

    // Caso 1: áudio desta mensagem está tocando → pausar
    if (ttsActiveMsgId === msg.id && ttsState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setTtsState('paused');
      return;
    }

    // Caso 2: áudio desta mensagem está pausado → retomar
    if (ttsActiveMsgId === msg.id && ttsState === 'paused' && audioRef.current) {
      try {
        await audioRef.current.play();
        setTtsState('playing');
      } catch {
        toast.error('Erro ao reproduzir áudio.');
        setTtsState('idle');
        setTtsActiveMsgId(null);
        audioRef.current = null;
      }
      return;
    }

    // Caso 3: outra mensagem (ou idle) → parar o atual e carregar novo
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }

    setTtsActiveMsgId(msg.id);
    setTtsState('loading');

    let base64 = ttsCache.get(cacheKey);
    if (!base64) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/openai-tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message_id: msg.id, text: msg.content, voice: 'alloy', speed }),
        });
        if (!res.ok) throw new Error(`TTS error ${res.status}`);
        const data = await res.json();
        base64 = data.audio_base64;
        if (base64) ttsCache.set(cacheKey, base64);
      } catch {
        toast.error('Erro ao gerar áudio.');
        setTtsState('idle');
        setTtsActiveMsgId(null);
        return;
      }
    }

    if (!base64) {
      setTtsState('idle');
      setTtsActiveMsgId(null);
      return;
    }

    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.playbackRate = speed;
    audio.onended = () => {
      setTtsState('idle');
      setTtsActiveMsgId(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setTtsState('idle');
      setTtsActiveMsgId(null);
      audioRef.current = null;
    };
    audioRef.current = audio;

    try {
      await audio.play();
      setTtsState('playing');
    } catch {
      toast.error('Erro ao reproduzir áudio.');
      setTtsState('idle');
      setTtsActiveMsgId(null);
      audioRef.current = null;
    }
  };

  const handleSpeedChange = (msg: Message, newSpeed: number) => {
    if (ttsActiveMsgId === msg.id && audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // ---- STT ----
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Detectar formato suportado pelo dispositivo (Android não suporta webm)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : MediaRecorder.isTypeSupported('audio/ogg')
            ? 'audio/ogg'
            : '';
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blobType = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        await transcribeAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 119) { stopRecording(); return prev; }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast.error('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setRecordingTime(0);
  };

  const transcribeAudio = async (blob: Blob) => {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) { toast.error('Sessão expirada.'); return; }

    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('audio', blob, 'audio.webm');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/openai-whisper`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Whisper error ${res.status}`);
      const data = await res.json();
      if (data.text) {
        // Always auto-send after transcription
        setTimeout(() => handleSend(data.text), 100);
      }
    } catch {
      toast.error('Erro ao transcrever áudio.');
    }
    setIsTranscribing(false);
  };

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const getAgentIcon = (iconName?: string) => {
    if (!iconName) return LucideIcons.Bot;
    return (LucideIcons as any)[iconName] || LucideIcons.Bot;
  };

  if (!selectedAgent) return null;

  // ---- Build HTML for print/download ----
  const buildChatHtml = (): string | null => {
    if (messages.length === 0) { toast.info('Nenhuma mensagem para exportar.'); return null; }
    const agentName = activeTab === 'apoio' ? 'Agente de Apoio' : selectedAgent.name;
    const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';
    const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const now = new Date().toLocaleString('pt-BR');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${escHtml(agentName)} — Conversa</title>
<style>
  @page { margin: 20mm 15mm; }
  body { font-family: 'DM Sans', sans-serif; color: #0F172A; font-size: 13px; line-height: 1.6; max-width: 700px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 18px; color: #10B981; margin-bottom: 4px; }
  .meta { font-size: 11px; color: #64748B; margin-bottom: 24px; }
  .message { margin-bottom: 16px; padding: 12px 16px; border-radius: 8px; }
  .user { background: #F1F5F9; border-left: 3px solid #10B981; page-break-after: avoid; }
  .assistant { background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 3px solid #CBD5E1; }
  .role-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; color: #64748B; }
  .content { white-space: pre-wrap; text-align: justify; }
</style></head><body>
<h1>${escHtml(agentName)}</h1>
<div class="meta">Usuário: ${escHtml(userName)} | Data: ${now}</div>
${messages.map(m => `<div class="message ${m.role}"><div class="role-label">${m.role === 'user' ? 'Você' : 'Agente'}</div><div class="content">${escHtml(m.content)}</div></div>`).join('')}
</body></html>`;

    return html;
  };

  const handlePrintChat = () => {
    const html = buildChatHtml();
    if (!html) return;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print(); }
    else { toast.error('Pop-up bloqueado. Permita pop-ups para imprimir.'); }
  };

  const handleDownloadPDF = () => {
    // Usa o mesmo mecanismo do imprimir — window.print() gera PDF nativo
    handlePrintChat();
  };

  const showUpgradeOverlay = !canUseAgent();
  const AgentIcon = getAgentIcon(selectedAgent.icon);
  const noTokens = tokensRemaining !== null && tokensRemaining <= 0 && profile?.subscription_status !== 'active';

  return (
    <AppLayout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-border mb-0 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-hidden">
            {selectedArea && <><span className="truncate max-w-[80px] cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/app/areas')}>{selectedArea.name}</span><ChevronRight size={14} /></>}
            {selectedContest && <><span className="truncate max-w-[80px] cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate(`/app/contests/${selectedArea?.slug || ''}`)}>{selectedContest.name}</span><ChevronRight size={14} /></>}
            {selectedSubject && <><span className="truncate max-w-[80px] cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate(`/app/subjects/${selectedContest?.id || ''}`)}>{selectedSubject.name}</span><ChevronRight size={14} /></>}
            <span className="text-foreground font-medium truncate max-w-[120px]">{selectedAgent.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-xs">Trocar agente</Button>
            <Button variant="ghost" size="sm" onClick={handlePrintChat} disabled={messages.length === 0}>
              <Printer size={16} className="mr-1" /> Imprimir
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownloadPDF} disabled={messages.length === 0}>
              <FileDown size={16} className="mr-1" /> Baixar PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
              <History size={16} className="mr-1" /> Histórico
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between py-2">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabType)}>
            <TabsList className="h-9">
              <TabsTrigger value="agente" className="text-xs px-4">Agente</TabsTrigger>
              <TabsTrigger value="apoio" className="text-xs px-4">Apoio</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-xs">
            Novo Chat
          </Button>
        </div>

        {/* Messages Area */}
        <div className="relative flex-1 overflow-y-auto rounded-lg bg-secondary/30 p-4">
          {showUpgradeOverlay && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
              <Lock size={40} className="text-muted-foreground mb-3" />
              <h3 className="font-display text-lg text-foreground mb-1">Acesso restrito</h3>
              <p className="text-sm text-muted-foreground mb-4">Este agente requer uma assinatura ativa.</p>
              <Button onClick={() => navigate('/app/upgrade')} className="bg-emerald hover:bg-emerald-hover text-primary-foreground">Ver planos →</Button>
            </div>
          )}

          {messages.length === 0 ? (
            <EmptyState activeTab={activeTab} agent={selectedAgent} AgentIcon={AgentIcon} />
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <ChatBubble
                  key={msg.id || i}
                  message={msg}
                  isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                  isThinking={isThinking && i === messages.length - 1 && msg.role === 'assistant'}
                  useFileSearch={selectedAgent?.tool_file_search}
                  ttsActiveMsgId={ttsActiveMsgId}
                  ttsState={ttsState}
                  onTTS={handleTTS}
                  onSpeedChange={handleSpeedChange}
                  onFeedback={handleFeedback}
                />
              ))}
              {isThinking && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <ThinkingIndicator useFileSearch={selectedAgent?.tool_file_search} />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Token warning */}
        {noTokens && (
          <div className="flex items-center justify-between rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2 mt-2">
            <span className="text-sm text-destructive">⚠️ Seus tokens acabaram.</span>
            <Button size="sm" variant="link" onClick={() => navigate('/app/upgrade')} className="text-destructive font-semibold">Assinar agora →</Button>
          </div>
        )}

        {/* Input Bar */}
        <div className="mt-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva aqui o tema do edital que você quer estudar"
              disabled={isStreaming || showUpgradeOverlay || isTranscribing}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              style={{ maxHeight: 140 }}
            />

            {/* STT button */}
            {isRecording ? (
              <Button
                size="icon"
                variant="destructive"
                onClick={stopRecording}
                className="shrink-0 h-9 w-9 animate-pulse"
                title="Parar gravação"
              >
                <MicOff size={16} />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={startRecording}
                disabled={isStreaming || showUpgradeOverlay || isTranscribing}
                className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                title="Gravar voz"
              >
                {isTranscribing ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
              </Button>
            )}

            {/* Recording timer */}
            {isRecording && (
              <span className="text-xs text-destructive font-mono shrink-0">{formatRecordingTime(recordingTime)}</span>
            )}

            {/* Send / Stop */}
            {isStreaming ? (
              <Button size="icon" variant="destructive" onClick={handleAbort} className="shrink-0 h-9 w-9">
                <Square size={16} />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || showUpgradeOverlay}
                className="shrink-0 h-9 w-9 bg-emerald hover:bg-emerald-hover text-primary-foreground"
              >
                <Send size={16} />
              </Button>
            )}
          </div>
          {tokensRemaining !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              {new Intl.NumberFormat('pt-BR').format(tokensRemaining)} tokens restantes
            </p>
          )}
        </div>
      </div>

      <ChatHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        userId={user?.id || ''}
        agentId={activeTab === 'agente' ? selectedAgent.id : undefined}
        agentSlug={activeTab === 'apoio' ? 'agente-de-apoio' : undefined}
        onRestore={handleRestoreConversation}
        activeConversationId={convId ?? undefined}
        onConversationDeleted={() => { setConvId(null); setMessages([]); }}
      />
    </AppLayout>
  );
}

// --- Sub-components ---

function EmptyState({
  activeTab, agent, AgentIcon,
}: {
  activeTab: TabType; agent: SelectedAgent; AgentIcon: any;
}) {
  const title = activeTab === 'apoio' ? 'Agente de Apoio' : agent.name;
  const desc = activeTab === 'apoio'
    ? 'Escreva abaixo as dúvidas que você teve no agente principal.'
    : agent.description || 'Como posso te ajudar?';
  const Icon = activeTab === 'apoio' ? Headset : AgentIcon;

  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-4">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10">
        <Icon className="text-emerald" size={32} />
      </div>
      <h2 className="font-display text-xl text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{desc}</p>
    </div>
  );
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;

function getThinkingMessage(elapsedSeconds: number, useFileSearch?: boolean): string {
  if (!useFileSearch) return 'Consultando base de dados...';
  if (elapsedSeconds < 10) return 'Consultando base de dados...';
  if (elapsedSeconds < 30) return 'Analisando conteúdo relevante...';
  if (elapsedSeconds < 60) return 'Elaborando resposta detalhada...';
  return 'Resposta complexa em preparação...';
}

function ThinkingIndicator({ useFileSearch }: { useFileSearch?: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const label = getThinkingMessage(elapsed, useFileSearch);

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="bg-navy text-[hsl(var(--text-light))] rounded-[12px_12px_12px_2px] px-4 py-3">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[thinking-dot_1.4s_ease-in-out_infinite]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[thinking-dot_1.4s_ease-in-out_0.2s_infinite]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[thinking-dot_1.4s_ease-in-out_0.4s_infinite]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  isStreaming,
  isThinking,
  useFileSearch,
  ttsActiveMsgId,
  ttsState,
  onTTS,
  onSpeedChange,
  onFeedback,
}: {
  message: Message;
  isStreaming: boolean;
  isThinking: boolean;
  useFileSearch?: boolean;
  ttsActiveMsgId: string | null;
  ttsState: 'idle' | 'loading' | 'playing' | 'paused';
  onTTS: (msg: Message, speed: number) => void;
  onSpeedChange: (msg: Message, speed: number) => void;
  onFeedback: (messageId: string, value: 'like' | 'dislike') => void;
}) {
  const isUser = message.role === 'user';
  const [ttsSpeed, setTtsSpeed] = useState<number>(1);
  const hasId = !!message.id;
  const isThisActive = ttsActiveMsgId === message.id;
  const isLoading = isThisActive && ttsState === 'loading';
  const isPlaying = isThisActive && ttsState === 'playing';
  const isPaused = isThisActive && ttsState === 'paused';
  const hasLoadedAudio = isThisActive || SPEED_OPTIONS.some(s => ttsCache.has(`${message.id}_${s}`));

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[85%]">
        <div
          className={`text-sm leading-relaxed ${
            isUser
              ? 'bg-emerald text-primary-foreground rounded-[12px_12px_2px_12px]'
              : 'bg-navy text-[hsl(var(--text-light))] rounded-[12px_12px_12px_2px]'
          } px-4 py-3`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : isThinking && !message.content ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Consultando base de dados</span>
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[thinking-dot_1.4s_ease-in-out_infinite]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[thinking-dot_1.4s_ease-in-out_0.2s_infinite]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[thinking-dot_1.4s_ease-in-out_0.4s_infinite]" />
              </span>
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {isStreaming && <span className="animate-pulse ml-0.5">▋</span>}
            </div>
          )}
        </div>

        {/* Action buttons for assistant messages */}
        {!isUser && !isStreaming && hasId && (
          <div className="flex items-center gap-1 mt-1 opacity-60 hover:opacity-100 transition-opacity">
            {/* TTS */}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              title="Ouvir"
              onClick={() => onTTS(message, ttsSpeed)}
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={14} />
              ) : isPaused ? (
                <Play size={14} />
              ) : (
                <Volume2 size={14} />
              )}
            </Button>

            {/* Speed selector (visible when audio loaded for this message) */}
            {hasLoadedAudio && (
              <div className="flex items-center gap-0.5">
                {SPEED_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setTtsSpeed(s);
                      onSpeedChange(message, s);
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      ttsSpeed === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}

            {/* Feedback */}
            <Button
              size="icon"
              variant="ghost"
              className={`h-7 w-7 ml-1 ${message.feedback === 'like' ? 'text-primary' : 'text-muted-foreground'}`}
              title="Gostei"
              onClick={() => onFeedback(message.id!, 'like')}
            >
              <ThumbsUp size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`h-7 w-7 ${message.feedback === 'dislike' ? 'text-destructive' : 'text-muted-foreground'}`}
              title="Não gostei"
              onClick={() => onFeedback(message.id!, 'dislike')}
            >
              <ThumbsDown size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
