import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Search, MoreVertical, FolderOpen, Pencil, Archive, ArchiveRestore,
  Trash2, MessageSquare, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  agents: {
    title: string;
    slug: string;
    subjects: {
      name: string;
      contests: {
        name: string;
        areas: { name: string };
      };
    };
  };
}

const PAGE_SIZE = 20;

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: '3months', label: '3 meses' },
];

function getPeriodDate(period: string): string | null {
  const now = new Date();
  switch (period) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case 'week': { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
    case 'month': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
    case '3months': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d.toISOString(); }
    default: return null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState<'active' | 'archived'>('active');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [contestFilter, setContestFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Inline rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchConversations = useCallback(async (reset = false) => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('conversations')
      .select(`id, title, created_at, updated_at, is_archived, agents!conversations_agent_id_fkey(title, slug, subjects!inner(name, contests!inner(name, areas!inner(name))))`)
      .eq('user_id', user.id)
      .eq('is_archived', tab === 'archived')
      .order('updated_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (!reset && conversations.length > 0) {
      query = query.lt('updated_at', conversations[conversations.length - 1].updated_at);
    }

    const periodDate = getPeriodDate(period);
    if (periodDate) query = query.gte('updated_at', periodDate);

    const { data, error } = await query;
    if (error) { toast.error('Erro ao carregar conversas.'); setLoading(false); return; }

    const typed = (data || []) as unknown as Conversation[];
    if (reset) {
      setConversations(typed);
    } else {
      setConversations(prev => [...prev, ...typed]);
    }
    setHasMore(typed.length === PAGE_SIZE);
    setLoading(false);
  }, [user, tab, period, conversations]);

  // Reset on filter/tab change
  useEffect(() => {
    setConversations([]);
    setHasMore(true);
  }, [tab, period]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      setConversations([]);
      fetchConversations(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [user, tab, period]);

  // Derived unique filter values
  const areas = [...new Set(conversations.map(c => c.agents.subjects.contests.areas.name))].sort();
  const contests = [...new Set(
    conversations
      .filter(c => areaFilter === 'all' || c.agents.subjects.contests.areas.name === areaFilter)
      .map(c => c.agents.subjects.contests.name)
  )].sort();
  const subjects = [...new Set(
    conversations
      .filter(c => contestFilter === 'all' || c.agents.subjects.contests.name === contestFilter)
      .map(c => c.agents.subjects.name)
  )].sort();

  // Reset dependent filters
  useEffect(() => { setContestFilter('all'); setSubjectFilter('all'); }, [areaFilter]);
  useEffect(() => { setSubjectFilter('all'); }, [contestFilter]);

  // Filtered list (client-side search + area/contest/subject)
  const filtered = conversations.filter(c => {
    if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (areaFilter !== 'all' && c.agents.subjects.contests.areas.name !== areaFilter) return false;
    if (contestFilter !== 'all' && c.agents.subjects.contests.name !== contestFilter) return false;
    if (subjectFilter !== 'all' && c.agents.subjects.name !== subjectFilter) return false;
    return true;
  });

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
  };

  const handleOpen = (conv: Conversation) => {
    localStorage.setItem('selectedConversationId', conv.id);
    localStorage.setItem('selectedTab', conv.agents.slug === 'agente-de-apoio' ? 'apoio' : 'agente');
    navigate('/app/chat');
  };

  const handleArchiveToggle = async (conv: Conversation) => {
    const newVal = !conv.is_archived;
    await supabase.from('conversations').update({ is_archived: newVal }).eq('id', conv.id);
    setConversations(prev => prev.filter(c => c.id !== conv.id));
    toast.success(newVal ? 'Conversa arquivada' : 'Conversa desarquivada');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('conversations').delete().eq('id', deleteId);
    setConversations(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast.success('Conversa excluída');
  };

  const handleRenameStart = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
    setTimeout(() => renameRef.current?.focus(), 50);
  };

  const handleRenameConfirm = async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    await supabase.from('conversations').update({ title: renameValue.trim() }).eq('id', renamingId);
    setConversations(prev => prev.map(c => c.id === renamingId ? { ...c, title: renameValue.trim() } : c));
    setRenamingId(null);
    toast.success('Conversa renomeada');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameConfirm();
    if (e.key === 'Escape') setRenamingId(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground">Histórico de Conversas</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} conversa{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={v => setTab(v as 'active' | 'archived')}>
          <TabsList>
            <TabsTrigger value="active">Ativas</TabsTrigger>
            <TabsTrigger value="archived">Arquivadas</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search + Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {areas.length > 1 && (
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {contests.length > 1 && (
              <Select value={contestFilter} onValueChange={setContestFilter}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Concurso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os concursos</SelectItem>
                  {contests.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {subjects.length > 1 && (
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Matéria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as matérias</SelectItem>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* List */}
        {loading && conversations.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare size={48} className="text-muted-foreground mb-4" />
            <h3 className="font-display text-lg text-foreground mb-1">Nenhuma conversa encontrada</h3>
            <p className="text-sm text-muted-foreground">
              {tab === 'archived'
                ? 'Você não tem conversas arquivadas.'
                : searchTerm
                  ? 'Tente ajustar sua busca ou filtros.'
                  : 'Comece uma nova conversa com um agente!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(conv => (
              <div
                key={conv.id}
                className="group rounded-lg border border-border bg-card p-4 hover:border-emerald/30 transition-colors cursor-pointer"
                onClick={() => handleOpen(conv)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {renamingId === conv.id ? (
                      <input
                        ref={renameRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={handleRenameConfirm}
                        onKeyDown={handleRenameKeyDown}
                        onClick={e => e.stopPropagation()}
                        className="w-full bg-transparent border-b border-emerald text-foreground text-sm font-medium focus:outline-none"
                      />
                    ) : (
                      <h3 className="text-sm font-medium text-foreground truncate">{conv.title}</h3>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-[10px]">{conv.agents.title}</Badge>
                      <Badge variant="outline" className="text-[10px]">{conv.agents.subjects.name}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(conv.updated_at)}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => handleOpen(conv)}>
                        <FolderOpen className="mr-2 h-4 w-4" /> Abrir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRenameStart(conv)}>
                        <Pencil className="mr-2 h-4 w-4" /> Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveToggle(conv)}>
                        {conv.is_archived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                        {conv.is_archived ? 'Desarquivar' : 'Arquivar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteId(conv.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {hasMore && !loading && (
              <Button variant="outline" className="w-full" onClick={() => fetchConversations(false)}>
                Carregar mais
              </Button>
            )}
            {loading && conversations.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald border-t-transparent" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. A conversa e todas as mensagens serão permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
