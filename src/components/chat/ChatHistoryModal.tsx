import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Archive, RotateCcw, Trash2, ArchiveRestore, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  agent_id?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  agentId?: string;
  agentSlug?: string;
  onRestore: (conversationId: string) => void;
  activeConversationId?: string;
  onConversationDeleted?: () => void;
}

export function ChatHistoryModal({ open, onClose, userId, agentId, agentSlug, onRestore, activeConversationId, onConversationDeleted }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    fetchConversations();
  }, [open, userId, agentId, agentSlug, tab]);

  const fetchConversations = async () => {
    setLoading(true);
    let query = supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, agent_id')
      .eq('user_id', userId)
      .eq('is_archived', tab === 'archived')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (agentId) query = query.eq('agent_id', agentId);

    const { data } = await query;
    setConversations(data || []);
    setLoading(false);
  };

  const handleArchive = async (convId: string) => {
    const { error } = await supabase.from('conversations').update({ is_archived: true }).eq('id', convId).eq('user_id', userId);
    if (!error) { toast.success('Conversa arquivada'); setConversations(prev => prev.filter(c => c.id !== convId)); }
    else toast.error('Erro ao arquivar conversa');
  };

  const handleUnarchive = async (convId: string) => {
    const { error } = await supabase.from('conversations').update({ is_archived: false }).eq('id', convId).eq('user_id', userId);
    if (!error) { toast.success('Conversa restaurada para Ativas'); setConversations(prev => prev.filter(c => c.id !== convId)); }
    else toast.error('Erro ao desarquivar conversa');
  };

  const handleDelete = async (convId: string) => {
    const { error } = await supabase.from('conversations').delete().eq('id', convId).eq('user_id', userId);
    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== convId));
      toast.success('Conversa excluída');
      if (activeConversationId === convId) onConversationDeleted?.();
    } else toast.error('Erro ao excluir conversa');
    setDeleteTarget(null);
  };

  const handleDownloadPDF = async (conv: Conversation) => {
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    let agentTitle = '—';
    if (conv.agent_id) {
      const { data: agent } = await supabase.from('agents').select('title').eq('id', conv.agent_id).single();
      if (agent) agentTitle = agent.title;
    }

    const formattedDate = new Date(conv.created_at).toLocaleString('pt-BR');
    const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';
    const userEmail = user?.email || '';
    const convTitle = conv.title || 'Conversa sem título';

    const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const bodyContent = `
<div class="header">
  <strong>${escHtml(agentTitle)}</strong><br/>
  Usuário: ${escHtml(userEmail)} | Data: ${formattedDate}
</div>
${(messages || []).map(m => `<div class="message ${m.role}">
  <span class="role-label">${m.role === 'user' ? 'VOCÊ' : 'AGENTE'}</span>
  <div class="content">${escHtml(m.content)}</div>
</div>`).join('')}
`;

    try {
      toast.info('Gerando PDF...');
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '700px';
      container.style.fontFamily = 'sans-serif';
      container.style.fontSize = '13px';
      container.style.lineHeight = '1.6';
      container.style.color = '#0F172A';
      container.style.padding = '24px';

      const headerStyle = 'margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #10B981;';
      const msgBase = 'margin-bottom:16px;padding:12px 16px;border-radius:8px;';
      const userStyle = msgBase + 'background:#F1F5F9;border-left:3px solid #10B981;';
      const assistantStyle = msgBase + 'background:#FFFFFF;border:1px solid #E2E8F0;border-left:3px solid #CBD5E1;';
      const roleStyle = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;color:#64748B;';
      const contentStyle = 'white-space:pre-wrap;';

      container.innerHTML = `
        <div style="${headerStyle}">
          <strong style="font-size:18px;color:#10B981;">${escHtml(agentTitle)}</strong><br/>
          <span style="font-size:11px;color:#64748B;">Usuário: ${escHtml(userEmail)} | Data: ${formattedDate}</span>
        </div>
        ${(messages || []).map(m => `<div style="${m.role === 'user' ? userStyle : assistantStyle}">
          <div style="${roleStyle}">${m.role === 'user' ? 'VOCÊ' : 'AGENTE'}</div>
          <div style="${contentStyle}">${escHtml(m.content)}</div>
        </div>`).join('')}
      `;
      document.body.appendChild(container);

      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      document.body.removeChild(container);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `${(conv.title || 'conversa').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    }
  };

  const filtered = conversations.filter(c =>
    !search || (c.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de Conversas</DialogTitle>
          </DialogHeader>

          <div className="flex rounded-lg border border-border overflow-hidden mb-3">
            <button
              onClick={() => setTab('active')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${tab === 'active' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
            >Ativas</button>
            <button
              onClick={() => setTab('archived')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${tab === 'archived' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
            >Arquivadas</button>
          </div>

          <Input placeholder="Buscar por título..." value={search} onChange={e => setSearch(e.target.value)} className="mb-3" />

          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {tab === 'active' ? 'Nenhuma conversa ativa encontrada.' : 'Nenhuma conversa arquivada encontrada.'}
              </p>
            ) : (
              filtered.map(conv => (
                <div key={conv.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{conv.title || 'Conversa sem título'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(conv.updated_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {tab === 'active' && (
                      <>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Restaurar" onClick={() => onRestore(conv.id)}>
                          <RotateCcw size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" title="Arquivar" onClick={() => handleArchive(conv.id)}>
                          <Archive size={14} />
                        </Button>
                      </>
                    )}
                    {tab === 'archived' && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" title="Desarquivar" onClick={() => handleUnarchive(conv.id)}>
                        <ArchiveRestore size={14} />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" title="Baixar PDF" onClick={() => handleDownloadPDF(conv)}>
                      <FileDown size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Excluir" onClick={() => setDeleteTarget(conv.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todas as mensagens desta conversa serão permanentemente removidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
