import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface Agent {
  id: string;
  title: string;
  slug: string;
  model: string;
  effort: string;
  is_active: boolean;
  display_order: number;
  system_prompt: string | null;
  tool_web_search: boolean;
  store: boolean;
}

export default function AdminPromptsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAgents = async () => {
    const { data } = await supabase
      .from('agents')
      .select('id, title, slug, model, effort, is_active, display_order, system_prompt, tool_web_search, store')
      .order('display_order');
    setAgents((data as Agent[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAgents(); }, []);

  const toggleActive = async (agent: Agent) => {
    const { error } = await supabase.from('agents').update({ is_active: !agent.is_active }).eq('id', agent.id);
    if (error) { toast.error(error.message); return; }
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, is_active: !a.is_active } : a)));
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from('agents').update({
      title: editing.title,
      system_prompt: editing.system_prompt,
      model: editing.model,
      effort: editing.effort,
      is_active: editing.is_active,
      tool_web_search: editing.tool_web_search,
      store: editing.store,
    }).eq('id', editing.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Agente atualizado');
    setEditing(null);
    fetchAgents();
  };

  const updateField = <K extends keyof Agent>(key: K, value: Agent[K]) => {
    setEditing((prev) => prev ? { ...prev, [key]: value } : null);
  };

  return (
    <AdminLayout>
      <Card className="bg-navy border-navy-border">
        <CardHeader>
          <CardTitle className="text-light text-base">Agentes / Prompts</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-border text-muted-light text-left">
                  <th className="pb-2 pr-4">Nome</th>
                  <th className="pb-2 pr-4">Slug</th>
                  <th className="pb-2 pr-4">Modelo</th>
                  <th className="pb-2 pr-4">Effort</th>
                  <th className="pb-2 pr-4">Ativo</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-navy-border/50 text-light">
                    <td className="py-2 pr-4">{a.title}</td>
                    <td className="py-2 pr-4 text-muted-light">{a.slug}</td>
                    <td className="py-2 pr-4">{a.model}</td>
                    <td className="py-2 pr-4">{a.effort}</td>
                    <td className="py-2 pr-4">
                      <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a)} />
                    </td>
                    <td className="py-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-light hover:text-light" onClick={() => setEditing({ ...a })}>
                        <Pencil size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={!!editing} onOpenChange={() => setEditing(null)}>
        <SheetContent className="bg-navy border-navy-border text-light w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-light">Editar Agente</SheetTitle>
          </SheetHeader>
          {editing && (
            <div className="mt-6 space-y-5">
              <div>
                <Label className="text-muted-light">Título</Label>
                <Input value={editing.title} onChange={(e) => updateField('title', e.target.value)} className="mt-1 border-navy-border bg-navy-deep text-light" />
              </div>
              <div>
                <Label className="text-muted-light">System Prompt</Label>
                <Textarea
                  value={editing.system_prompt ?? ''}
                  onChange={(e) => updateField('system_prompt', e.target.value)}
                  className="mt-1 min-h-[300px] border-navy-border bg-navy-deep text-light font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-muted-light">Modelo</Label>
                <Select value={editing.model} onValueChange={(v) => updateField('model', v)}>
                  <SelectTrigger className="mt-1 border-navy-border bg-navy-deep text-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                    <SelectItem value="o1">o1</SelectItem>
                    <SelectItem value="o3-mini">o3-mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-light">Effort</Label>
                <Select value={editing.effort} onValueChange={(v) => updateField('effort', v)}>
                  <SelectTrigger className="mt-1 border-navy-border bg-navy-deep text-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">minimal</SelectItem>
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-light">Ativo</Label>
                <Switch checked={editing.is_active} onCheckedChange={(v) => updateField('is_active', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-light">Web Search</Label>
                <Switch checked={editing.tool_web_search} onCheckedChange={(v) => updateField('tool_web_search', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-light">Store</Label>
                <Switch checked={editing.store} onCheckedChange={(v) => updateField('store', v)} />
              </div>
            </div>
          )}
          <SheetFooter className="mt-6">
            <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
