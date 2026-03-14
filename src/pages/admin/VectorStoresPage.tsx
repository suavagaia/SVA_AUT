import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, Check, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const SUPABASE_URL = 'https://lxteajwzovoeclbytdrp.supabase.co';

interface VectorStore {
  id: string;
  name: string;
  file_counts: { total: number };
  created_at: number;
}

interface Agent {
  id: string;
  title: string;
  slug: string;
  tool_file_search_vector_store_ids: string[] | null;
}

function getAccessToken() {
  const raw = localStorage.getItem('sb-lxteajwzovoeclbytdrp-auth-token');
  return raw ? JSON.parse(raw)?.access_token : null;
}

export default function VectorStoresPage() {
  const [stores, setStores] = useState<VectorStore[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogStore, setDialogStore] = useState<VectorStore | null>(null);
  const [dialogSelections, setDialogSelections] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = getAccessToken();

    const [vsRes, agentsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/functions/v1/openai-vector-stores`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).catch(() => ({ vector_stores: [] })),
      supabase
        .from('agents')
        .select('id, title, slug, tool_file_search_vector_store_ids')
        .eq('tool_file_search', true)
        .order('title'),
    ]);

    setStores(vsRes.vector_stores ?? []);
    setAgents(agentsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getLinkedAgents = (vsId: string) =>
    agents.filter(a => a.tool_file_search_vector_store_ids?.includes(vsId));

  const openDialog = (store: VectorStore) => {
    const sel: Record<string, boolean> = {};
    agents.forEach(a => {
      sel[a.id] = a.tool_file_search_vector_store_ids?.includes(store.id) ?? false;
    });
    setDialogSelections(sel);
    setDialogStore(store);
  };

  const handleSave = async () => {
    if (!dialogStore) return;
    setSaving(true);
    const vsId = dialogStore.id;

    try {
      for (const agent of agents) {
        const hadIt = agent.tool_file_search_vector_store_ids?.includes(vsId) ?? false;
        const wantsIt = dialogSelections[agent.id] ?? false;
        if (hadIt === wantsIt) continue;

        const currentIds = agent.tool_file_search_vector_store_ids ?? [];
        const newIds = wantsIt
          ? [...new Set([...currentIds, vsId])]
          : currentIds.filter(id => id !== vsId);

        await supabase.from('agents').update({ tool_file_search_vector_store_ids: newIds }).eq('id', agent.id);
      }
      toast.success('Vínculos atualizados com sucesso');
      setDialogStore(null);
      fetchData();
    } catch {
      toast.error('Erro ao salvar vínculos');
    } finally {
      setSaving(false);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('pt-BR');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-light">Vector Stores</h2>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}
            className="border-navy-border text-light hover:bg-navy-border/50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full bg-navy-border/30" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-xl border border-navy-border bg-navy p-8 text-center">
            <p className="text-muted-light">Nenhum vector store encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {stores.map(store => {
              const linked = getLinkedAgents(store.id);
              return (
                <div key={store.id} className="rounded-xl border border-navy-border bg-navy p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-light text-lg">{store.name || 'Sem nome'}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-light">
                        <span className="font-mono">{store.id.slice(0, 16)}...</span>
                        <button onClick={() => copyId(store.id)} className="hover:text-light transition-colors">
                          {copiedId === store.id ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openDialog(store)}
                      className="border-navy-border text-light hover:bg-navy-border/50 shrink-0">
                      <Link2 size={14} className="mr-1" /> Gerenciar vínculos
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-light">
                    <span>{store.file_counts?.total ?? 0} arquivos</span>
                    <span>Criado em {formatDate(store.created_at)}</span>
                  </div>

                  {linked.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {linked.map(a => (
                        <Badge key={a.id} variant="secondary" className="bg-emerald/10 text-emerald border-0 text-xs">
                          {a.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={!!dialogStore} onOpenChange={(o) => !o && setDialogStore(null)}>
        <DialogContent className="bg-navy border-navy-border text-light max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-light">
              Vínculos — {dialogStore?.name || dialogStore?.id.slice(0, 16)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto py-2">
            {agents.length === 0 ? (
              <p className="text-sm text-muted-light">Nenhum agente com file_search ativo.</p>
            ) : (
              agents.map(agent => (
                <label key={agent.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-navy-border/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={dialogSelections[agent.id] ?? false}
                    onCheckedChange={(v) => setDialogSelections(p => ({ ...p, [agent.id]: !!v }))}
                  />
                  <span className="text-sm">{agent.title}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialogStore(null)}
              className="border-navy-border text-light hover:bg-navy-border/50">Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}
              className="bg-emerald hover:bg-emerald-hover text-primary-foreground">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
