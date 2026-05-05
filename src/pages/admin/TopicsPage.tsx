import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

function toSlug(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface Area    { id: string; name: string; }
interface Contest { id: string; name: string; area_id: string; }
interface Subject { id: string; name: string; contest_id: string; topic_count?: number; }
interface Topic   { id: string; name: string; slug: string; subject_id: string; display_order: number; is_active: boolean; agent_count?: number; }
interface Agent   { id: string; title: string; slug: string; }

const emptyTopic = { name: '', slug: '', display_order: 0, is_active: true };

export default function AdminTopicsPage() {
  // Filtros
  const [areas, setAreas]       = useState<Area[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedArea, setSelectedArea]       = useState('');
  const [selectedContest, setSelectedContest] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);

  // Topics
  const [topics, setTopics]     = useState<Topic[]>([]);
  const [editing, setEditing]   = useState<(typeof emptyTopic & { id?: string }) | null>(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<Topic | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  // Agentes do topic
  const [managingTopic, setManagingTopic] = useState<Topic | null>(null);
  const [allAgents, setAllAgents]         = useState<Agent[]>([]);
  const [topicAgents, setTopicAgents]     = useState<string[]>([]); // agent_ids vinculados
  const [agentSaving, setAgentSaving]     = useState(false);

  // Carregar áreas
  useEffect(() => {
    supabase.from('areas').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => setAreas((data as Area[]) ?? []));
    supabase.from('agents').select('id, title, slug').eq('is_active', true).order('title')
      .then(({ data }) => setAllAgents((data as Agent[]) ?? []));
  }, []);

  // Carregar concursos ao selecionar área
  useEffect(() => {
    if (!selectedArea) { setContests([]); setSelectedContest(''); return; }
    supabase.from('contests').select('id, name, area_id').eq('area_id', selectedArea).order('name')
      .then(({ data }) => setContests((data as Contest[]) ?? []));
    setSelectedContest('');
    setSelectedSubject('');
  }, [selectedArea]);

  // Carregar cargos ao selecionar concurso
  useEffect(() => {
    if (!selectedContest) { setSubjects([]); setSelectedSubject(''); return; }
    supabase.from('subjects').select('id, name, contest_id').eq('contest_id', selectedContest).eq('is_active', true).order('display_order')
      .then(async ({ data }) => {
        const subs = (data as Subject[]) ?? [];
        // contar topics por subject
        const { data: tCounts } = await supabase.from('topics').select('subject_id');
        const counts: Record<string, number> = {};
        (tCounts ?? []).forEach((t: any) => { counts[t.subject_id] = (counts[t.subject_id] || 0) + 1; });
        setSubjects(subs.map(s => ({ ...s, topic_count: counts[s.id] || 0 })));
      });
    setSelectedSubject('');
  }, [selectedContest]);

  // Carregar topics ao selecionar cargo
  const fetchTopics = async (subjectId = selectedSubject) => {
    if (!subjectId) { setTopics([]); return; }
    setLoading(true);
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('display_order');
    // contar agentes por topic
    const { data: taCounts } = await supabase.from('topic_agents').select('topic_id');
    const counts: Record<string, number> = {};
    (taCounts ?? []).forEach((t: any) => { counts[t.topic_id] = (counts[t.topic_id] || 0) + 1; });
    setTopics(((data as Topic[]) ?? []).map(t => ({ ...t, agent_count: counts[t.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => { fetchTopics(selectedSubject); }, [selectedSubject]);

  // === CRUD Topics ===
  const openNew = () => { setEditing({ ...emptyTopic }); setSlugManual(false); };
  const openEdit = (t: Topic) => { setEditing({ id: t.id, name: t.name, slug: t.slug, display_order: t.display_order, is_active: t.is_active }); setSlugManual(true); };

  const handleSave = async () => {
    if (!editing || !selectedSubject) return;
    setSaving(true);
    const payload = { name: editing.name, slug: editing.slug, subject_id: selectedSubject, display_order: editing.display_order, is_active: editing.is_active };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from('topics').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('topics').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? 'Matéria atualizada' : 'Matéria criada');
    setEditing(null);
    fetchTopics();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('topics').delete().eq('id', deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Matéria excluída');
    setDeleting(null);
    fetchTopics();
  };

  // === Gerenciar Agentes do Topic ===
  const openAgents = async (t: Topic) => {
    setManagingTopic(t);
    const { data } = await supabase.from('topic_agents').select('agent_id').eq('topic_id', t.id);
    setTopicAgents((data ?? []).map((r: any) => r.agent_id));
  };

  const toggleAgent = (agentId: string) => {
    setTopicAgents(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const saveAgents = async () => {
    if (!managingTopic) return;
    setAgentSaving(true);
    // Apagar todos os vínculos atuais
    await supabase.from('topic_agents').delete().eq('topic_id', managingTopic.id);
    // Inserir os selecionados
    if (topicAgents.length > 0) {
      const rows = topicAgents.map((agent_id, i) => ({ topic_id: managingTopic.id, agent_id, display_order: i + 1 }));
      await supabase.from('topic_agents').insert(rows);
    }
    setAgentSaving(false);
    toast.success('Agentes atualizados');
    setManagingTopic(null);
    fetchTopics();
  };

  const subjectName = subjects.find(s => s.id === selectedSubject)?.name;

  return (
    <AdminLayout>
      <Card className="border-navy-border bg-navy mb-6">
        <CardHeader>
          <CardTitle className="text-light">Filtrar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="min-w-[200px]">
            <Label className="text-muted-light">Área</Label>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="mt-1 border-navy-border bg-navy-deep text-light"><SelectValue placeholder="Selecione a área" /></SelectTrigger>
              <SelectContent>{areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px]">
            <Label className="text-muted-light">Concurso</Label>
            <Select value={selectedContest} onValueChange={setSelectedContest} disabled={!selectedArea}>
              <SelectTrigger className="mt-1 border-navy-border bg-navy-deep text-light"><SelectValue placeholder="Selecione o concurso" /></SelectTrigger>
              <SelectContent>{contests.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-[220px]">
            <Label className="text-muted-light">Cargo</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedContest}>
              <SelectTrigger className="mt-1 border-navy-border bg-navy-deep text-light"><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
              <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.topic_count ?? 0})</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-navy-border bg-navy">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-light">
            Matérias {subjectName ? `— ${subjectName}` : ''}
          </CardTitle>
          {selectedSubject && (
            <Button onClick={openNew} size="sm" className="bg-emerald hover:bg-emerald/90 text-white gap-1">
              <Plus size={16} /> Nova Matéria
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!selectedSubject ? (
            <p className="text-muted-light py-8 text-center">Selecione um cargo acima para ver as matérias</p>
          ) : loading ? (
            <p className="text-muted-light">Carregando…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-border text-left text-muted-light">
                    <th className="pb-3 pr-4">Ordem</th>
                    <th className="pb-3 pr-4">Nome</th>
                    <th className="pb-3 pr-4">Slug</th>
                    <th className="pb-3 pr-4">Agentes</th>
                    <th className="pb-3 pr-4">Ativo</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map(t => (
                    <tr key={t.id} className="border-b border-navy-border/50">
                      <td className="py-3 pr-4 text-light">{t.display_order}</td>
                      <td className="py-3 pr-4 text-light">{t.name}</td>
                      <td className="py-3 pr-4 text-muted-light font-mono text-xs">{t.slug}</td>
                      <td className="py-3 pr-4 text-muted-light">{t.agent_count ?? 0}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${t.is_active ? 'bg-emerald/20 text-emerald' : 'bg-red-500/20 text-red-400'}`}>
                          {t.is_active ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="py-3 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="text-muted-light hover:text-light"><Pencil size={15} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openAgents(t)} className="text-blue-400 hover:text-blue-300" title="Gerenciar Agentes"><BookOpen size={15} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(t)} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></Button>
                      </td>
                    </tr>
                  ))}
                  {topics.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-light">Nenhuma matéria cadastrada para este cargo</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Topic */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="border-navy-border bg-navy text-light sm:max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar Matéria' : 'Nova Matéria'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-light">Nome</Label>
              <Input className="mt-1 border-navy-border bg-navy-deep text-light" value={editing?.name ?? ''} onChange={(e) => {
                const name = e.target.value;
                setEditing(p => p ? { ...p, name, ...(slugManual ? {} : { slug: toSlug(name) }) } : p);
              }} />
            </div>
            <div>
              <Label className="text-muted-light">Slug</Label>
              <Input className="mt-1 border-navy-border bg-navy-deep text-light font-mono text-xs" value={editing?.slug ?? ''} onChange={(e) => { setSlugManual(true); setEditing(p => p ? { ...p, slug: e.target.value } : p); }} />
            </div>
            <div>
              <Label className="text-muted-light">Ordem de exibição</Label>
              <Input type="number" className="mt-1 border-navy-border bg-navy-deep text-light w-24" value={editing?.display_order ?? 0} onChange={(e) => setEditing(p => p ? { ...p, display_order: Number(e.target.value) } : p)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editing?.is_active ?? true} onCheckedChange={(v) => setEditing(p => p ? { ...p, is_active: v } : p)} />
              <Label className="text-muted-light">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="border-navy-border text-muted-light">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !editing?.name} className="bg-emerald hover:bg-emerald/90 text-white">{saving ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Topic */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="border-navy-border bg-navy text-light">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir matéria "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-light">Esta ação não pode ser desfeita. Os agentes vinculados serão desvinculados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-navy-border text-muted-light">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Agents Modal */}
      <Dialog open={!!managingTopic} onOpenChange={(o) => !o && setManagingTopic(null)}>
        <DialogContent className="border-navy-border bg-navy text-light sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Agentes — {managingTopic?.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-light mb-3">Selecione os agentes disponíveis para esta matéria:</p>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {allAgents.map(agent => (
              <div key={agent.id} className="flex items-center gap-3 p-2 rounded border border-navy-border/40 hover:bg-navy-deep/50">
                <input
                  type="checkbox"
                  id={`agent-${agent.id}`}
                  checked={topicAgents.includes(agent.id)}
                  onChange={() => toggleAgent(agent.id)}
                  className="accent-emerald w-4 h-4"
                />
                <label htmlFor={`agent-${agent.id}`} className="text-sm text-light cursor-pointer flex-1">
                  {agent.title}
                  <span className="ml-2 text-muted-light font-mono text-xs">{agent.slug}</span>
                </label>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setManagingTopic(null)} className="border-navy-border text-muted-light">Cancelar</Button>
            <Button onClick={saveAgents} disabled={agentSaving} className="bg-emerald hover:bg-emerald/90 text-white">
              {agentSaving ? 'Salvando…' : `Salvar (${topicAgents.length} agente${topicAgents.length !== 1 ? 's' : ''})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
