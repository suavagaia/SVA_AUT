import { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Send, Square, History, Plus, ChevronRight, Headset, Lock } from 'lucide-react';
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
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

type TabType = 'agente' | 'apoio';

const STORAGE_KEY = 'sb-lxteajwzovoeclbytdrp-auth-token';

const SUGGESTION_CHIPS: Record<string, string[]> = {
  questoes: ['Gere 5 questões sobre...', 'Explique a alternativa correta de...'],
  legislacao: ['Explique o art. X da lei Y', 'Quais as alterações recentes em...'],
  sumulas: ['Liste as súmulas sobre...', 'O que diz a súmula X?'],
  informativos: ['Resuma os informativos sobre...', 'Quais os temas mais cobrados?'],
  redacao: ['Corrija minha redação:', 'Dê um tema para treinar'],
  portugues: ['Explique o uso de...', 'Gere questões sobre...'],
  default: ['Como posso te usar?', 'Por onde começar?'],
};

const APOIO_CHIPS = [
  'Como funciona o sistema de tokens?',
  'Como cancelar minha assinatura?',
  'Como usar o histórico de conversas?',
];

function getSuggestionsForAgent(slug: string): string[] {
  for (const [key, chips] of Object.entries(SUGGESTION_CHIPS)) {
    if (key !== 'default' && slug.includes(key)) return chips;
  }
  return SUGGESTION_CHIPS.default;
}

function getAccessToken(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw)?.access_token : null;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  // Selected context from localStorage
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
  const [selectedArea, setSelectedArea] = useState<{ id: string; name: string } | null>(null);
  const [selectedContest, setSelectedContest] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('agente');

  // Agente tab state
  const [agentMessages, setAgentMessages] = useState<Message[]>([]);
  const [agentConvId, setAgentConvId] = useState<string | null>(null);
  const [agentStreaming, setAgentStreaming] = useState(false);

  // Apoio tab state
  const [apoioMessages, setApoioMessages] = useState<Message[]>([]);
  const [apoioConvId, setApoioConvId] = useState<string | null>(null);
  const [apoioStreaming, setApoioStreaming] = useState(false);

  // Input
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // History modal
  const [historyOpen, setHistoryOpen] = useState(false);

  // Tokens
  const [tokensRemaining, setTokensRemaining] = useState<number | null>(null);

  // Current tab helpers
  const messages = activeTab === 'agente' ? agentMessages : apoioMessages;
  const setMessages = activeTab === 'agente' ? setAgentMessages : setApoioMessages;
  const convId = activeTab === 'agente' ? agentConvId : apoioConvId;
  const setConvId = activeTab === 'agente' ? setAgentConvId : setApoioConvId;
  const isStreaming = activeTab === 'agente' ? agentStreaming : apoioStreaming;
  const setIsStreaming = activeTab === 'agente' ? setAgentStreaming : setApoioStreaming;

  // Load context from localStorage
  useEffect(() => {
    const agent = localStorage.getItem('selectedAgent');
    if (!agent) {
      navigate('/app/areas');
      return;
    }
    setSelectedAgent(JSON.parse(agent));
    setSelectedArea(JSON.parse(localStorage.getItem('selectedArea') || 'null'));
    setSelectedContest(JSON.parse(localStorage.getItem('selectedContest') || 'null'));
    setSelectedSubject(JSON.parse(localStorage.getItem('selectedSubject') || 'null'));
  }, [navigate]);

  // Fetch token balance
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_token_balances')
      .select('agents_tokens_remaining')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setTokensRemaining(data.agents_tokens_remaining);
      });
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages, apoioMessages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [inputText]);

  const canUseAgent = useCallback((): boolean => {
    if (profile?.role === 'admin') return true;
    if (profile?.subscription_status === 'active') return true;
    if (activeTab === 'apoio') return true;
    return false;
  }, [profile, activeTab]);

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    const userMsg: Message = { role: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsStreaming(true);

    // Add empty assistant message
    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const slug = activeTab === 'agente' ? selectedAgent?.slug : 'agente-de-apoio';

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://lxteajwzovoeclbytdrp.supabase.co'}/functions/v1/execute-prompt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dGVhand6b3ZvZWNsYnl0ZHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzkxMzcsImV4cCI6MjA4ODkxNTEzN30.BLB9qSJcZMKsWhix46ASUbOW2lA0PSeyHN97jMQQGkQ',
          },
          body: JSON.stringify({
            agent_slug: slug,
            message: userMsg.content,
            conversation_id: convId,
          }),
          signal: controller.signal,
        }
      );

      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        setIsStreaming(false);
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (response.status === 402) {
        toast.error('Seus tokens acabaram.', {
          action: { label: 'Ver planos', onClick: () => navigate('/app/upgrade') },
        });
        setIsStreaming(false);
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

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
            }

            if (event.delta) {
              assistantContent += event.delta;
              const updated = assistantContent;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: updated };
                return copy;
              });
            }

            if (event.done) {
              setIsStreaming(false);
              // Refresh token balance
              if (user) {
                supabase
                  .from('user_token_balances')
                  .select('agents_tokens_remaining')
                  .eq('user_id', user.id)
                  .single()
                  .then(({ data }) => {
                    if (data) setTokensRemaining(data.agents_tokens_remaining);
                  });
              }
            }
          } catch (_) {}
        }
      }

      setIsStreaming(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled
      } else {
        toast.error('Erro ao processar resposta. Tente novamente.');
        setMessages(prev => prev.slice(0, -1));
      }
      setIsStreaming(false);
    }
  };

  const handleAbort = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (text: string) => {
    setInputText(text);
    textareaRef.current?.focus();
  };

  const handleNewChat = () => {
    setMessages([]);
    setConvId(null);
  };

  const handleRestoreConversation = async (conversationId: string) => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgs) {
      setMessages(msgs as Message[]);
      setConvId(conversationId);
    }
    setHistoryOpen(false);
  };

  const getAgentIcon = (iconName?: string) => {
    if (!iconName) return LucideIcons.Bot;
    return (LucideIcons as any)[iconName] || LucideIcons.Bot;
  };

  if (!selectedAgent) return null;

  const showUpgradeOverlay = !canUseAgent();
  const AgentIcon = getAgentIcon(selectedAgent.icon);
  const noTokens = tokensRemaining !== null && tokensRemaining <= 0 && profile?.subscription_status !== 'active';

  return (
    <AppLayout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
        {/* Header: Breadcrumb + Actions */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-border mb-0 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-hidden">
            {selectedArea && <><span className="truncate max-w-[80px]">{selectedArea.name}</span><ChevronRight size={14} /></>}
            {selectedContest && <><span className="truncate max-w-[80px]">{selectedContest.name}</span><ChevronRight size={14} /></>}
            {selectedSubject && <><span className="truncate max-w-[80px]">{selectedSubject.name}</span><ChevronRight size={14} /></>}
            <span className="text-foreground font-medium truncate max-w-[120px]">{selectedAgent.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-xs">
              Trocar agente
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
            <Plus size={14} className="mr-1" /> Novo Chat
          </Button>
        </div>

        {/* Messages Area */}
        <div className="relative flex-1 overflow-y-auto rounded-lg bg-secondary/30 p-4">
          {showUpgradeOverlay && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
              <Lock size={40} className="text-muted-foreground mb-3" />
              <h3 className="font-display text-lg text-foreground mb-1">Acesso restrito</h3>
              <p className="text-sm text-muted-foreground mb-4">Este agente requer uma assinatura ativa.</p>
              <Button onClick={() => navigate('/app/upgrade')} className="bg-emerald hover:bg-emerald-hover text-primary-foreground">
                Ver planos →
              </Button>
            </div>
          )}

          {messages.length === 0 ? (
            <EmptyState
              activeTab={activeTab}
              agent={selectedAgent}
              AgentIcon={AgentIcon}
              onChipClick={handleChipClick}
            />
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <ChatBubble
                  key={i}
                  message={msg}
                  isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Token warning banner */}
        {noTokens && (
          <div className="flex items-center justify-between rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2 mt-2">
            <span className="text-sm text-destructive">⚠️ Seus tokens acabaram.</span>
            <Button size="sm" variant="link" onClick={() => navigate('/app/upgrade')} className="text-destructive font-semibold">
              Assinar agora →
            </Button>
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
              placeholder="Digite sua mensagem..."
              disabled={isStreaming || showUpgradeOverlay}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              style={{ maxHeight: 140 }}
            />
            {isStreaming ? (
              <Button size="icon" variant="destructive" onClick={handleAbort} className="shrink-0 h-9 w-9">
                <Square size={16} />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
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

      {/* History Modal */}
      <ChatHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        userId={user?.id || ''}
        agentId={activeTab === 'agente' ? selectedAgent.id : undefined}
        agentSlug={activeTab === 'apoio' ? 'agente-de-apoio' : undefined}
        onRestore={handleRestoreConversation}
        activeConversationId={convId ?? undefined}
        onConversationDeleted={() => {
          setConvId(null);
          setMessages([]);
        }}
      />
    </AppLayout>
  );
}

// --- Sub-components ---

function EmptyState({
  activeTab,
  agent,
  AgentIcon,
  onChipClick,
}: {
  activeTab: TabType;
  agent: SelectedAgent;
  AgentIcon: any;
  onChipClick: (text: string) => void;
}) {
  const chips = activeTab === 'apoio' ? APOIO_CHIPS : getSuggestionsForAgent(agent.slug);
  const title = activeTab === 'apoio' ? 'Agente de Apoio' : agent.name;
  const desc = activeTab === 'apoio'
    ? 'Tire dúvidas sobre a plataforma, sua assinatura ou qualquer outra questão.'
    : agent.description || 'Como posso te ajudar?';
  const Icon = activeTab === 'apoio' ? Headset : AgentIcon;

  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-4">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10">
        <Icon className="text-emerald" size={32} />
      </div>
      <h2 className="font-display text-xl text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{desc}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {chips.map((chip, i) => (
          <button
            key={i}
            onClick={() => onChipClick(chip)}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`text-sm leading-relaxed ${
          isUser
            ? 'bg-emerald text-primary-foreground rounded-[12px_12px_2px_12px] max-w-[75%]'
            : 'bg-navy text-[hsl(var(--text-light))] rounded-[12px_12px_12px_2px] max-w-[85%]'
        } px-4 py-3`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {isStreaming && <span className="animate-pulse ml-0.5">▋</span>}
          </div>
        )}
      </div>
    </div>
  );
}
