import { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Copy, Check, Plus, Upload, X, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  // web usa sessionStorage; app nativo usa localStorage — lê de ambos
  const raw = sessionStorage.getItem('sb-lxteajwzovoeclbytdrp-auth-token')
    || localStorage.getItem('sb-lxteajwzovoeclbytdrp-auth-token');
  return raw ? JSON.parse(raw)?.access_token : null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VectorStoresPage() {
  const [stores, setStores] = useState<VectorStore[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);

  // Upload dialog
  const [uploadStore, setUploadStore] = useState<VectorStore | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const uploadFileRef = useRef<HTMLInputElement>(null);

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

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('pt-BR');

  const handleCreate = async () => {
    if (!createName.trim()) { toast.error('Informe um nome'); return; }
    if (createFiles.length === 0) { toast.error('Selecione pelo menos um arquivo'); return; }
    setCreating(true);
    try {
      const token = getAccessToken();
      const formData = new FormData();
      formData.append('name', createName.trim());
      for (const file of createFiles) {
        formData.append('files', file);
      }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/openai-vector-stores`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Vector store "${createName}" criado com ${data.vector_store?.files_uploaded ?? createFiles.length} arquivo(s)!`);
        setCreateOpen(false);
        setCreateName('');
        setCreateFiles([]);
        fetchData();
      } else {
        toast.error(data.error || 'Erro ao criar vector store');
      }
    } catch {
      toast.error('Erro ao criar vector store');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadFiles = async () => {
    if (!uploadStore || uploadFiles.length === 0) return;
    setUploading(true);
    try {
      const token = getAccessToken();
      const formData = new FormData();
      for (const file of uploadFiles) {
        formData.append('files', file);
      }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/openai-vector-stores/${uploadStore.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${uploadFiles.length} arquivo(s) adicionado(s) com sucesso!`);
        setUploadStore(null);
        setUploadFiles([]);
        fetchData();
      } else {
        toast.error(data.error || 'Erro ao enviar arquivos');
      }
    } catch {
      toast.error('Erro ao enviar arquivos');
    } finally {
      setUploading(false);
    }
  };

  const removeCreateFile = (idx: number) => setCreateFiles(f => f.filter((_, i) => i !== idx));
  const removeUploadFile = (idx: number) => setUploadFiles(f => f.filter((_, i) => i !== idx));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-light">Vector Stores</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}
              className="bg-transparent border-navy-border text-light hover:bg-navy-border/50">
              <Plus size={16} className="mr-1" /> Novo Vector Store
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}
              className="bg-transparent border-navy-border text-light hover:bg-navy-border/50">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </Button>
          </div>
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
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => { setUploadStore(store); setUploadFiles([]); }}
                        className="bg-transparent border-navy-border text-light hover:bg-navy-border/50">
                        <Upload size={14} className="mr-1" /> Adicionar arquivos
                      </Button>
                    </div>
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

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o && !creating) { setCreateOpen(false); setCreateName(''); setCreateFiles([]); } }}>
        <DialogContent className="bg-navy border-navy-border text-light max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-light">Novo Vector Store</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-light">Nome</label>
              <Input value={createName} onChange={e => setCreateName(e.target.value)}
                placeholder="Ex: Informativos STJ 2025"
                className="bg-navy-dark border-navy-border text-light placeholder:text-muted-light" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-light">Arquivos</label>
              <input ref={createFileRef} type="file" multiple accept=".pdf,.txt,.md,.docx" className="hidden"
                onChange={e => { if (e.target.files) setCreateFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
              <Button variant="outline" size="sm" onClick={() => createFileRef.current?.click()}
                className="bg-transparent border-navy-border text-light hover:bg-navy-border/50 w-full border-dashed">
                <Upload size={14} className="mr-2" /> Selecionar arquivos (.pdf, .txt, .md, .docx)
              </Button>
            </div>
            {createFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {createFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-navy-dark px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-muted-light shrink-0" />
                      <span className="truncate text-light">{f.name}</span>
                      <span className="text-muted-light shrink-0">{formatBytes(f.size)}</span>
                    </div>
                    <button onClick={() => removeCreateFile(i)} className="text-muted-light hover:text-light ml-2">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setCreateOpen(false); setCreateName(''); setCreateFiles([]); }}
              disabled={creating} className="bg-transparent border-navy-border text-light hover:bg-navy-border/50">Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={creating || !createName.trim() || createFiles.length === 0}
              className="bg-emerald hover:bg-emerald-hover text-primary-foreground">
              {creating ? <><Loader2 size={14} className="animate-spin mr-1" /> Criando...</> : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={!!uploadStore} onOpenChange={(o) => { if (!o && !uploading) { setUploadStore(null); setUploadFiles([]); } }}>
        <DialogContent className="bg-navy border-navy-border text-light max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-light">
              Adicionar arquivos — {uploadStore?.name || uploadStore?.id.slice(0, 16)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input ref={uploadFileRef} type="file" multiple accept=".pdf,.txt,.md,.docx" className="hidden"
              onChange={e => { if (e.target.files) setUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} />
            <Button variant="outline" size="sm" onClick={() => uploadFileRef.current?.click()}
              className="bg-transparent border-navy-border text-light hover:bg-navy-border/50 w-full border-dashed">
              <Upload size={14} className="mr-2" /> Selecionar arquivos (.pdf, .txt, .md, .docx)
            </Button>
            {uploadFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-navy-dark px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-muted-light shrink-0" />
                      <span className="truncate text-light">{f.name}</span>
                      <span className="text-muted-light shrink-0">{formatBytes(f.size)}</span>
                    </div>
                    <button onClick={() => removeUploadFile(i)} className="text-muted-light hover:text-light ml-2">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setUploadStore(null); setUploadFiles([]); }}
              disabled={uploading} className="bg-transparent border-navy-border text-light hover:bg-navy-border/50">Cancelar</Button>
            <Button size="sm" onClick={handleUploadFiles} disabled={uploading || uploadFiles.length === 0}
              className="bg-emerald hover:bg-emerald-hover text-primary-foreground">
              {uploading ? <><Loader2 size={14} className="animate-spin mr-1" /> Enviando...</> : `Enviar ${uploadFiles.length} arquivo(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}