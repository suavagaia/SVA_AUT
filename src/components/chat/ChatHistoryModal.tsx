import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  agentId?: string;
  agentSlug?: string;
  onRestore: (conversationId: string) => void;
}

export function ChatHistoryModal({ open, onClose, userId, agentId, agentSlug, onRestore }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    fetchConversations();
  }, [open, userId, agentId, agentSlug]);

  const fetchConversations = async () => {
    setLoading(true);
    let query = supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data } = await query;
    setConversations(data || []);
    setLoading(false);
  };

  const handleArchive = async (convId: string) => {
    await supabase
      .from('conversations')
      .update({ is_archived: true })
      .eq('id', convId);
    toast.success('Conversa arquivada');
    setConversations(prev => prev.filter(c => c.id !== convId));
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
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Histórico de Conversas</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3"
        />
        <div className="max-h-[50vh] overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conversa encontrada.</p>
          ) : (
            filtered.map(conv => (
              <div key={conv.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conv.title || 'Conversa sem título'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(conv.updated_at)}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRestore(conv.id)}>
                    <RotateCcw size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => handleArchive(conv.id)}>
                    <Archive size={14} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
