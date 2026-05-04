import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Area {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

const emptyArea: Omit<Area, 'id'> & { id?: string } = {
  name: '',
  slug: '',
  icon: '',
  display_order: 0,
  is_active: true,
};

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Omit<Area, 'id'> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Area | null>(null);
  const [nameManualSlug, setNameManualSlug] = useState(false);

  const fetchAreas = async () => {
    const { data } = await supabase.from('areas').select('*').order('display_order');
    setAreas((data as Area[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAreas(); }, []);

  const openNew = () => { setEditing({ ...emptyArea }); setNameManualSlug(false); };
  const openEdit = (a: Area) => { setEditing({ ...a }); setNameManualSlug(true); };

  const handleSave = async () => {
    if (!editing?.icon?.trim()) {
      alert('Por favor, informe o ícone da área antes de salvar.');
      return;
    }
    if (!editing) return;
    setSaving(true);
    const payload = {
      name: editing.name,
      slug: editing.slug,
      icon: editing.icon || 'BookOpen',
      display_order: editing.display_order,
      is_active: editing.is_active,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from('areas').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('areas').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? 'Área atualizada' : 'Área criada');
    setEditing(null);
    fetchAreas();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('areas').delete().eq('id', deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Área excluída');
    setDeleting(null);
    fetchAreas();
  };

  return (
    <AdminLayout>
      <Card className="border-navy-border bg-navy">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-light">Gerenciar Áreas</CardTitle>
          <Button onClick={openNew} size="sm" className="bg-emerald hover:bg-emerald/90 text-white gap-1">
            <Plus size={16} /> Nova Área
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-light">Carregando…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-border text-left text-muted-light">
                    <th className="pb-3 pr-4">Ordem</th>
                    <th className="pb-3 pr-4">Nome</th>
                    <th className="pb-3 pr-4">Slug</th>
                    <th className="pb-3 pr-4">Ativo</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((a) => (
                    <tr key={a.id} className="border-b border-navy-border/50">
                      <td className="py-3 pr-4 text-light">{a.display_order}</td>
                      <td className="py-3 pr-4 text-light">{a.name}</td>
                      <td className="py-3 pr-4 text-muted-light font-mono text-xs">{a.slug}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${a.is_active ? 'bg-emerald/20 text-emerald' : 'bg-red-500/20 text-red-400'}`}>
                          {a.is_active ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="py-3 flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)} className="text-muted-light hover:text-light"><Pencil size={15} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(a)} className="text-red-400 hover:text-red-300"><Trash2 size={15} /></Button>
                      </td>
                    </tr>
                  ))}
                  {areas.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-light">Nenhuma área cadastrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="border-navy-border bg-navy text-light sm:max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar Área' : 'Nova Área'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-light">Nome</Label>
              <Input className="mt-1 border-navy-border bg-navy-deep text-light" value={editing?.name ?? ''} onChange={(e) => {
                const name = e.target.value;
                setEditing((p) => p ? { ...p, name, ...(nameManualSlug ? {} : { slug: toSlug(name) }) } : p);
              }} />
            </div>
            <div>
              <Label className="text-muted-light">Slug</Label>
              <Input className="mt-1 border-navy-border bg-navy-deep text-light font-mono text-xs" value={editing?.slug ?? ''} onChange={(e) => {
                setNameManualSlug(true);
                setEditing((p) => p ? { ...p, slug: e.target.value } : p);
              }} />
            </div>
            <div>
              <Label className="text-muted-light">Ícone (emoji ou nome)</Label>
              <Input className="mt-1 border-navy-border bg-navy-deep text-light" placeholder="Ex: BookOpen, Scale, Briefcase" required value={editing?.icon ?? ''} onChange={(e) => setEditing((p) => p ? { ...p, icon: e.target.value } : p)} />
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
            <Button onClick={handleSave} disabled={saving || !editing?.name || !editing?.icon?.trim()} className="bg-emerald hover:bg-emerald/90 text-white">
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="border-navy-border bg-navy text-light">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir área "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-light">Esta ação não pode ser desfeita. Concursos vinculados podem ser afetados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-navy-border text-muted-light">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
