import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

function toSlug(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface Area { id: string; name: string; }
interface Contest {
  id: string;
  area_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  area_name?: string;
  subject_count?: number;
}
interface Subject {
  id: string;
  contest_id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

const emptyContest = { name: '', slug: '', area_id: '', description: '', display_order: 0, is_active: true };
const emptySubject = { name: '', slug: '', display_order: 0, is_active: true };

export default function AdminContestsPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(typeof emptyContest & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Contest | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  // Subjects management
  const [managingContest, setManagingContest] = useState<Contest | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [editingSubject, setEditingSubject] = useState<(typeof emptySubject & { id?: string }) | null>(null);
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [subjectSlugManual, setSubjectSlugManual] = useState(false);

  const fetchAreas = async () => {
    const { data } = await supabase.from('areas').select('id, name').eq('is_active', true).order('display_order');
    setAreas((data as Area[]) ?? []);
  };

  const fetchContests = async () => {
    const { data } = await supabase.from('contests').select('*, areas(name)').order('display_order');
    const mapped = (data ?? []).map((c: any) => ({ ...c, area_name: c.areas?.name }));
    // Count subjects per contest
    const { data: subCounts } = await supabase.from('subjects').select('contest_id');
    const counts: Record<string, number> = {};
    (subCounts ?? []).forEach((s: any) => { counts[s.contest_id] = (counts[s.contest_id] || 0) + 1; });
    setContests(mapped.map((c: any) => ({ ...c, subject_count: counts[c.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => { fetchAreas(); fetchContests(); }, []);

  const openNew = () => { setEditing({ ...emptyContest }); setSlugManual(false); };
  const openEdit = (c: Contest) => { setEditing({ id: c.id, name: c.name, slug: c.slug, area_id: c.area_id, description: c.description ?? '', display_order: c.display_order, is_active: c.is_active }); setSlugManual(true); };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = { name: editing.name, slug: editing.slug, area_id: editing.area_id, description: editing.description || null, display_order: editing.display_order, is_active: editing.is_active };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from('contests').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('contests').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? 'Concurso atualizado' : 'Concurso criado');
    setEditing(null);
    fetchContests();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('contests').delete().eq('id', deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Concurso excluído');
    setDeleting(null);
    fetchContests();
  };

  // === Subjects ===
  const openSubjects = async (c: Contest) => {
    setManagingContest(c);
    setSubjectsLoading(true);
    const { data } = await supabase.from('subjects').select('*').eq('contest_id', c.id).order('display_order');
    setSubjects((data as Subject[]) ?? []);
    setSubjectsLoading(false);
  };

  const fetchSubjects = async () => {
    if (!managingContest) return;
    const { data } = await supabase.from('subjects').select('*').eq('contest_id', managingContest.id).order('display_order');
    setSubjects((data as Subject[]) ?? []);
  };

  const handleSaveSubject = async () => {
    if (!editingSubject || !managingContest) return;
    setSubjectSaving(true);
    const payload = { name: editingSubject.name, slug: editingSubject.slug, display_order: editingSubject.display_order, is_active: editingSubject.is_active, contest_id: managingContest.id };
    let error;
    if (editingSubject.id) {
      ({ error } = await supabase.from('subjects').update(payload).eq('id', editingSubject.id));
    } else {
      ({ error } = await supabase.from('subjects').insert(payload));
    }
    setSubjectSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingSubject.id ? 'Matéria atualizada' : 'Matéria criada');
    setEditingSubject(null);
    fetchSubjects();
    fetchContests();
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    const { error } = await supabase.from('subjects').delete().eq('id', deletingSubject.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Matéria excluída');
    setDeletingSubject(null);
    fetchSubjects();
    fetchContests();
  };

  return (
    <AdminLayout>
      <Card className="border-navy-border bg-navy">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-light">Gerenciar Concursos</CardTitle>
          <Button onClick={openNew} size="sm" className="bg-emerald hover:bg-emerald/90 text-white gap-1"><Plus size={16} /> Novo Concurso</Button>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-light">Carregando…</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-border text-left text-muted-light">
                    <th className="pb-3 pr-4">Ordem</th>
                    <th className="pb-3 pr-4">Nome</th>
                    <th className="pb-3 pr-4">Área</th>
                    <th className="pb-3 pr-4">Matérias</th>
                    <th className="pb-3 pr-4">Ativo</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contests.map((c) => (
                    <tr key={c.id} className="border-b border-navy-border/50">
                      <td className="py-3 pr-4 text-light">{c.display_order}</td>
                      <td className="py-3 pr-4 text-light">{c.name}</td>
                      <td className="py-3 pr-4 text-muted-light">{c.area_name ?? '—'}</td>
                      <td className="py-3 pr-4 text-muted-light">{c.subject_count}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? 'bg-emerald/20 text-emerald' : 'bg-red-500/20 text-red-400'}`}>
                          {c.is_active ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="py-3 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="text-muted-light hover:text-light"><Pencil size={15} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openSubjects(c)} className="text-blue-400 hover:text-blue-300" title="Gerenciar Matérias"><BookOpen size={15} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(c)} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></Button>
                      </td>
                    </tr>
                  ))}
                  {contests.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-light">Nenhum concurso cadastrado</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Contest Modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="border-navy-border bg-navy text-light sm:max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar Concurso' : 'Novo Concurso'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-light">Nome</Label>
              <Input className="mt-1 border-navy-border bg-navy-deep text-light" value={editing?.name ?? ''} onChange={(e) => {
                const name = e.target.value;
                setEditing((p) => p ? { ...p, name, ...(slugManual ? {} : { slug: toSlug(name) }) } : p);
              }} />
            </div>
            <div>
              <Label className="text-muted-light">Slug</Label>
              <Input className="mt-1 border-navy-border bg-navy-deep text-light font-mono text-xs" value={editing?.slug ?? ''} onChange={(e) => { setSlugManual(true); setEditing((p) => p ? { ...p, slug: e.target.value } : p); }} />
            </div>
            <div>
              <Label className="text-muted-light">Área</Label>
              <Select value={editing?.area_id ?? ''} onValueChange={(v) => setEditing((p) => p ? { ...p, area_id: v } : p)}>
                <SelectTrigger className="mt-1 border-navy-border bg-navy-deep text-light"><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                <SelectContent>{areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-light">Descrição</Label>
              <Textarea className="mt-1 border-navy-border bg-navy-deep text-light" rows={2} value={editing?.description ?? ''} onChange={(e) => setEditing((p) => p ? { ...p, description: e.target.value } : p)} />
            </div>
            <div>
              <Label className="text-muted-light">Ordem de exibição</Label>
              <Input type="number" className="mt-1 border-navy-border bg-navy-deep text-light w-24" value={editing?.display_order ?? 0} onChange={(e) => setEditing((p) => p ? { ...p, display_order: Number(e.target.value) } : p)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editing?.is_active ?? true} onCheckedChange={(v) => setEditing((p) => p ? { ...p, is_active: v } : p)} />
              <Label className="text-muted-light">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="border-navy-border text-muted-light">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !editing?.name || !editing?.area_id} className="bg-emerald hover:bg-emerald/90 text-white">{saving ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contest Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="border-navy-border bg-navy text-light">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir concurso "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-light">Esta ação não pode ser desfeita. Matérias vinculadas podem ser afetadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-navy-border text-muted-light">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Subjects Modal */}
      <Dialog open={!!managingContest} onOpenChange={(o) => !o && setManagingContest(null)}>
        <DialogContent className="border-navy-border bg-navy text-light sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Matérias — {managingContest?.name}</DialogTitle></DialogHeader>
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={() => { setEditingSubject({ ...emptySubject }); setSubjectSlugManual(false); }} className="bg-emerald hover:bg-emerald/90 text-white gap-1"><Plus size={14} /> Nova Matéria</Button>
          </div>
          {subjectsLoading ? <p className="text-muted-light">Carregando…</p> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-border text-left text-muted-light">
                  <th className="pb-2 pr-3">Ordem</th>
                  <th className="pb-2 pr-3">Nome</th>
                  <th className="pb-2 pr-3">Slug</th>
                  <th className="pb-2 pr-3">Ativo</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-b border-navy-border/50">
                    <td className="py-2 pr-3 text-light">{s.display_order}</td>
                    <td className="py-2 pr-3 text-light">{s.name}</td>
                    <td className="py-2 pr-3 text-muted-light font-mono text-xs">{s.slug}</td>
                    <td className="py-2 pr-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.is_active ? 'bg-emerald/20 text-emerald' : 'bg-red-500/20 text-red-400'}`}>{s.is_active ? 'Sim' : 'Não'}</span>
                    </td>
                    <td className="py-2 flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingSubject({ ...s }); setSubjectSlugManual(true); }} className="text-muted-light hover:text-light"><Pencil size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeletingSubject(s)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-light">Nenhuma matéria neste concurso</td></tr>}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Subject Modal */}
      <Dialog open={!!editingSubject} onOpenChange={(o) => !o && setEditingSubject(null)}>
        <DialogContent className="border-navy-border bg-navy text-light sm:max-w-md">
          <DialogHeader><DialogTitle>{editingSubject?.id ? 'Editar Matéria' : 'Nova Matéria'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-light">Nome</Label>
              <Input className="mt-1 border-navy-border bg-navy-deep text-light" value={editingSubject?.name ?? ''} onChange={(e) => {
                const name = e.target.value;
                setEditingSubject((p) => p ? { ...p, name, ...(subjectSlugManual ? {} : { slug: toSlug(name) }) } : p);
              }} />
            </div>
            <div>
              <Label className="text-muted-light">Slug</Label>
              <Input className="mt-1 border-navy-border bg-navy-deep text-light font-mono text-xs" value={editingSubject?.slug ?? ''} onChange={(e) => { setSubjectSlugManual(true); setEditingSubject((p) => p ? { ...p, slug: e.target.value } : p); }} />
            </div>
            <div>
              <Label className="text-muted-light">Ordem de exibição</Label>
              <Input type="number" className="mt-1 border-navy-border bg-navy-deep text-light w-24" value={editingSubject?.display_order ?? 0} onChange={(e) => setEditingSubject((p) => p ? { ...p, display_order: Number(e.target.value) } : p)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editingSubject?.is_active ?? true} onCheckedChange={(v) => setEditingSubject((p) => p ? { ...p, is_active: v } : p)} />
              <Label className="text-muted-light">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubject(null)} className="border-navy-border text-muted-light">Cancelar</Button>
            <Button onClick={handleSaveSubject} disabled={subjectSaving || !editingSubject?.name} className="bg-emerald hover:bg-emerald/90 text-white">{subjectSaving ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation */}
      <AlertDialog open={!!deletingSubject} onOpenChange={(o) => !o && setDeletingSubject(null)}>
        <AlertDialogContent className="border-navy-border bg-navy text-light">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir matéria "{deletingSubject?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-light">Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-navy-border text-muted-light">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubject} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
