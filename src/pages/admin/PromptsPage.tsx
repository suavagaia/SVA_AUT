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
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://lxteajwzovoeclbytdrp.supabase.co';

function getAccessToken() {
  const raw = localStorage.getItem('sb-lxteajwzovoeclbytdrp-auth-token');
  return raw ? JSON.parse(raw)?.access_token : null;
}

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
  tool_file_search: boolean;
  tool_file_search_vector_store_ids: string[] | null;
  file_search_max_results: number;
  verbosity: string;
  response_format: string;
  max_completion_tokens: number;
  use_supabase_rag: boolean;
  supabase_rag_table: string | null;
  rag_config: RagConfigItem[];
  subject_id: string | null;
}

interface RagConfigItem {
  tipo: string;
  tribunal: string;
  max_results: number;
}

// Fontes disponíveis para RAG
const RAG_SOURCES: { label: string; tipo: string; tribunal: string }[] = [
  { label: "Informativos STJ", tipo: "informativo", tribunal: "STJ" },
  { label: "Informativos STF", tipo: "informativo", tribunal: "STF" },
  { label: "Informativos TST", tipo: "informativo", tribunal: "TST" },
  { label: "Súmulas STJ", tipo: "sumula", tribunal: "STJ" },
  { label: "Súmulas STF", tipo: "sumula", tribunal: "STF" },
  { label: "Súmulas TST", tipo: "sumula", tribunal: "TST" },
  { label: "Súmulas Vinculantes STF", tipo: "sumula_vinculante", tribunal: "STF" },
  { label: "Orientações Jurisprudenciais TST", tipo: "oj_tst", tribunal: "TST" },
  { label: "OJs Transitórias TST", tipo: "oj_tst_transitoria", tribunal: "TST" },
];

interface Area { id: string; name: string; }
interface Contest { id: string; name: string; area_id: string; }
interface SubjectOption { id: string; name: string; contest_id: string; }

export default function AdminPromptsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents.filter(a =>
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [areas, setAreas] = useState<Area[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [editingSubjectIds, setEditingSubjectIds] = useState<string[]>([]);
  // Mentoria prompt
  const [mentoriaPrompt, setMentoriaPrompt] = useState('');
  const [mentoriaDesc, setMentoriaDesc] = useState('');
  const [mentoriaLoading, setMentoriaLoading] = useState(true);
  const [mentoriaSaving, setMentoriaSaving] = useState(false);

  // Manual
  const [manualContent, setManualContent] = useState('');
  const [manualLoading, setManualLoading] = useState(true);
  const [manualSaving, setManualSaving] = useState(false);

  // Free user mentoria limit
  const [mentoriaLimit, setMentoriaLimit] = useState('3');
  const [mentoriaLimitLoading, setMentoriaLimitLoading] = useState(true);
  const [mentoriaLimitSaving, setMentoriaLimitSaving] = useState(false);

  const fetchMentoriaPrompt = async () => {
    const { data } = await supabase
      .from('system_prompts')
      .select('id, prompt, description')
      .eq('key', 'mentorship_chat')
      .single();
    if (data) {
      setMentoriaPrompt(data.prompt ?? '');
      setMentoriaDesc(data.description ?? '');
    }
    setMentoriaLoading(false);
  };

  const saveMentoriaPrompt = async () => {
    setMentoriaSaving(true);
    const { error } = await supabase
      .from('system_prompts')
      .update({ prompt: mentoriaPrompt, updated_at: new Date().toISOString() })
      .eq('key', 'mentorship_chat');
    setMentoriaSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Prompt de mentoria atualizado');
  };

  const fetchManual = async () => {
    const { data } = await supabase
      .from('system_prompts')
      .select('prompt')
      .eq('key', 'user_manual')
      .single();
    setManualContent(data?.prompt ?? '');
    setManualLoading(false);
  };

  const saveManual = async () => {
    setManualSaving(true);
    const { error } = await supabase
      .from('system_prompts')
      .update({ prompt: manualContent, updated_at: new Date().toISOString() })
      .eq('key', 'user_manual');
    setManualSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Manual atualizado');
  };

  const fetchMentoriaLimit = async () => {
    const { data } = await supabase
      .from('system_prompts')
      .select('prompt')
      .eq('key', 'free_user_mentoria_limit')
      .maybeSingle();
    setMentoriaLimit(data?.prompt ?? '3');
    setMentoriaLimitLoading(false);
  };

  const saveMentoriaLimit = async () => {
    setMentoriaLimitSaving(true);
    const { error } = await supabase
      .from('system_prompts')
      .upsert({ key: 'free_user_mentoria_limit', prompt: String(mentoriaLimit), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setMentoriaLimitSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Limite atualizado');
  };

  // Vector stores for agent editing


  const fetchAgents = async () => {
    const { data } = await supabase
      .from('agents')
      .select('id, title, slug, model, effort, is_active, display_order, system_prompt, tool_web_search, tool_file_search, tool_file_search_vector_store_ids, file_search_max_results, verbosity, response_format, max_completion_tokens, use_supabase_rag, supabase_rag_table, rag_config, subject_id, reasoning_effort')
      .order('display_order');
    setAgents((data as Agent[]) ?? []);
    setLoading(false);
  };

  // Fetch areas, contests, subjects for the subject selector
  useEffect(() => {
    const fetchHierarchy = async () => {
      const [areasRes, contestsRes, subjectsRes] = await Promise.all([
        supabase.from('areas').select('id, name').order('display_order'),
        supabase.from('contests').select('id, name, area_id').order('display_order'),
        supabase.from('subjects').select('id, name, contest_id').order('display_order'),
      ]);
      setAreas(areasRes.data ?? []);
      setContests(contestsRes.data ?? []);
      setSubjectOptions(subjectsRes.data ?? []);
    };
    fetchHierarchy();
  }, []);

  // When editing starts, fetch agent's subject_ids from agent_subjects
  useEffect(() => {
    if (!editing) { setEditingSubjectIds([]); return; }
    const fetchAgentSubjects = async () => {
      const { data } = await supabase
        .from('agent_subjects')
        .select('subject_id')
        .eq('agent_id', editing.id);
      setEditingSubjectIds(data?.map((r: any) => r.subject_id) ?? []);
    };
    fetchAgentSubjects();
  }, [editing?.id]);

  useEffect(() => { fetchAgents(); fetchMentoriaPrompt(); fetchManual(); fetchMentoriaLimit(); }, []);

  const toggleActive = async (agent: Agent) => {
    const { error } = await supabase.from('agents').update({ is_active: !agent.is_active }).eq('id', agent.id);
    if (error) { toast.error(error.message); return; }
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, is_active: !a.is_active } : a)));
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    // Update agent fields
    const { error } = await supabase.from('agents').update({
      title: editing.title,
      system_prompt: editing.system_prompt,
      model: editing.model,
      effort: editing.effort,
      is_active: editing.is_active,
      tool_web_search: editing.tool_web_search,
      tool_file_search: editing.tool_file_search,
      tool_file_search_vector_store_ids: editing.tool_file_search_vector_store_ids,
      use_supabase_rag: editing.use_supabase_rag ?? false,
      supabase_rag_table: editing.use_supabase_rag ? (editing.supabase_rag_table || null) : null,
      rag_config: editing.rag_config ?? [],
      max_completion_tokens: editing.max_completion_tokens ?? 8000,
      reasoning_effort: editing.reasoning_effort ?? 'none',
      verbosity: editing.verbosity ?? 'low',
    }).eq('id', editing.id);
    if (error) { setSaving(false); toast.error(error.message); return; }

    // Sync agent_subjects: delete all then insert current
    await supabase.from('agent_subjects').delete().eq('agent_id', editing.id);
    if (editingSubjectIds.length > 0) {
      const rows = editingSubjectIds.map(sid => ({ agent_id: editing.id, subject_id: sid }));
      const { error: insertErr } = await supabase.from('agent_subjects').insert(rows);
      if (insertErr) { setSaving(false); toast.error(insertErr.message); return; }
    }

    setSaving(false);
    toast.success('Agente atualizado');
    setEditing(null);
    fetchAgents();
  };

  const updateField = <K extends keyof Agent>(key: K, value: Agent[K]) => {
    setEditing((prev) => prev ? { ...prev, [key]: value } : null);
  };

  return (
    <AdminLayout>
      {/* Tabela de Custos */}
      <div className="space-y-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-light">Custos por Modelo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Preços da OpenAI API por 1 milhão de tokens (USD). Atualizado março/2026.
          </p>
        </div>

        <div className="rounded-xl border border-navy-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-deep border-b border-navy-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Modelo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Uso recomendado</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Input /1M</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Cache /1M</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Output /1M</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-border">
              {[
                { model: 'gpt-5.4',      badge: 'Frontier',  uso: 'Raciocínio complexo, análise profunda', input: '$2.50',  cache: '$0.25',  output: '$15.00', highlight: false },
                { model: 'gpt-5-mini',   badge: 'Recomendado', uso: 'Tarefas bem definidas, questões, súmulas', input: '$0.25',  cache: '$0.025', output: '$2.00',  highlight: true },
                { model: 'gpt-5-nano',   badge: 'Econômico', uso: 'Busca simples, listagem, classificação', input: '$0.05',  cache: '$0.005', output: '$0.40',  highlight: false },
                { model: 'gpt-5',        badge: 'Legado',    uso: 'Versão original ago/2025', input: '$1.25',  cache: '$0.125', output: '$10.00', highlight: false },
                { model: 'gpt-4o',       badge: 'Legado',    uso: 'Modelos anteriores', input: '$2.50',  cache: '$0.25',  output: '$10.00', highlight: false },
                { model: 'gpt-4o-mini',  badge: 'Legado',    uso: 'Modelos anteriores', input: '$0.15',  cache: '$0.015', output: '$0.60',  highlight: false },
              ].map((row) => (
                <tr
                  key={row.model}
                  className={row.highlight
                    ? 'bg-emerald-950/20'
                    : 'bg-navy-card hover:bg-navy-card-hover transition-colors'}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-light">{row.model}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        row.badge === 'Frontier' ? 'bg-blue-500/20 text-blue-400' :
                        row.badge === 'Recomendado' ? 'bg-emerald/20 text-emerald' :
                        row.badge === 'Econômico' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-navy-border text-muted-foreground'
                      }`}>{row.badge}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.uso}</td>
                  <td className="px-4 py-3 text-right font-mono text-light">{row.input}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{row.cache}</td>
                  <td className="px-4 py-3 text-right font-mono text-light">{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Cache: 90% de desconto sobre o input para prompts repetidos. Batch API: 50% de desconto para processamento assíncrono em 24h.
          <a href="https://openai.com/api/pricing/" target="_blank" rel="noopener" className="ml-1 text-emerald hover:underline">
            Ver preços oficiais →
          </a>
        </p>
      </div>

      {/* Mentoria Prompt Section */}
      <Card className="bg-navy border-navy-border mb-6">
        <CardHeader>
          <CardTitle className="text-light text-base">Prompt de Mentoria</CardTitle>
          <p className="text-muted-light text-xs">{mentoriaDesc || 'Prompt usado para gerar cronogramas de estudo personalizados'}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {mentoriaLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
            </div>
          ) : (
            <>
              <Textarea
                value={mentoriaPrompt}
                onChange={(e) => setMentoriaPrompt(e.target.value)}
                className="min-h-[300px] border-navy-border bg-navy-deep text-light font-mono text-xs"
                placeholder="Prompt de mentoria..."
              />
              <p className="text-xs text-muted-light">
                Variáveis disponíveis: <code className="text-emerald">{'{{wakeUpText}}'}</code>, <code className="text-emerald">{'{{schedulesText}}'}</code>, <code className="text-emerald">{'{{subjectsText}}'}</code>
              </p>
              <Button onClick={saveMentoriaPrompt} disabled={mentoriaSaving} className="bg-emerald hover:bg-emerald-hover text-primary-foreground">
                {mentoriaSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Section */}
      <Card className="bg-navy border-navy-border mb-6">
        <CardHeader>
          <CardTitle className="text-light text-base">Manual do Usuário</CardTitle>
          <p className="text-muted-light text-xs">Conteúdo exibido na página /app/manual. Suporta Markdown.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {manualLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
            </div>
          ) : (
            <>
              <Textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                className="min-h-[400px] border-navy-border bg-navy-deep text-light font-mono text-xs"
                placeholder="Conteúdo do manual em Markdown..."
              />
              <div className="flex items-center gap-3">
                <Button onClick={saveManual} disabled={manualSaving} className="bg-emerald hover:bg-emerald-hover text-primary-foreground">
                  {manualSaving ? 'Salvando...' : 'Salvar'}
                </Button>
                <a href="/app/manual" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald hover:underline">
                  Ver manual →
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Free User Mentoria Limit */}
      <Card className="bg-navy border-navy-border mb-6">
        <CardHeader>
          <CardTitle className="text-light text-base">Limite de Gerações de Mentoria (Plano Gratuito)</CardTitle>
          <p className="text-muted-light text-xs">Número máximo de vezes que um usuário gratuito pode gerar o cronograma de mentoria.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {mentoriaLimitLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
            </div>
          ) : (
            <>
              <Input
                type="number"
                min={0}
                value={mentoriaLimit}
                onChange={(e) => setMentoriaLimit(e.target.value)}
                className="w-32 border-navy-border bg-navy-deep text-light"
              />
              <Button onClick={saveMentoriaLimit} disabled={mentoriaLimitSaving} className="bg-emerald hover:bg-emerald-hover text-primary-foreground">
                {mentoriaLimitSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-navy border-navy-border">
        <CardHeader>
          <CardTitle className="text-light text-base">Agentes / Prompts</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nome ou slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-sm rounded-md border border-navy-border bg-navy-deep px-3 py-2 text-sm text-light placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald"
            />
            {searchQuery && (
              <p className="mt-1 text-xs text-muted-foreground">{filteredAgents.length} agente(s) encontrado(s)</p>
            )}
          </div>
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
                  <th className="pb-2 pr-4">Max Tokens</th>
                  <th className="pb-2 pr-4">Ativo</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((a) => (
                  <tr key={a.id} className="border-b border-navy-border/50 text-light">
                    <td className="py-2 pr-4">{a.title}</td>
                    <td className="py-2 pr-4 text-muted-light">{a.slug}</td>
                    <td className="py-2 pr-4">{a.model}</td>
                    <td className="py-2 pr-4">{a.max_completion_tokens ?? 8000}</td>
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
              {/* Multi-select subjects grouped by Area > Contest */}
              <div>
                <Label className="text-muted-light">Matérias vinculadas</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">Selecione as matérias onde este agente aparecerá.</p>
                <div className="max-h-60 overflow-y-auto space-y-3 rounded border border-navy-border bg-navy-deep p-3">
                  {areas.map(area => {
                    const areaContests = contests.filter(c => c.area_id === area.id);
                    if (areaContests.length === 0) return null;
                    return (
                      <div key={area.id}>
                        <p className="text-xs font-semibold text-muted-light mb-1">{area.name}</p>
                        {areaContests.map(contest => {
                          const contestSubjects = subjectOptions.filter(s => s.contest_id === contest.id);
                          if (contestSubjects.length === 0) return null;
                          return (
                            <div key={contest.id} className="ml-3 mb-2">
                              <p className="text-xs text-muted-foreground mb-1">{contest.name}</p>
                              {contestSubjects.map(sub => (
                                <label key={sub.id} className="flex items-center gap-2 ml-3 cursor-pointer py-0.5">
                                  <Checkbox
                                    checked={editingSubjectIds.includes(sub.id)}
                                    onCheckedChange={(checked) => {
                                      setEditingSubjectIds(prev =>
                                        checked ? [...prev, sub.id] : prev.filter(id => id !== sub.id)
                                      );
                                    }}
                                  />
                                  <span className="text-sm text-light">{sub.name}</span>
                                </label>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
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
                    <SelectItem value="gpt-5.4">GPT-5.4 (Frontier — recomendado)</SelectItem>
                    <SelectItem value="gpt-5-mini">GPT-5 Mini (rápido e econômico)</SelectItem>
                    <SelectItem value="gpt-5-nano">GPT-5 Nano (mais rápido e barato)</SelectItem>
                    <SelectItem value="gpt-5">GPT-5 (original ago/2025)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (legado)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (legado)</SelectItem>
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

              {/* ─── Supabase RAG — Multiselect ─── */}
              <div>
                <Label className="text-muted-light">Supabase RAG</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  Selecione as fontes de jurisprudência e defina quantos resultados buscar de cada uma.
                </p>
                <div className="space-y-2">
                  {RAG_SOURCES.map(source => {
                    const key = `${source.tipo}|${source.tribunal}`;
                    const existing = (editing.rag_config ?? []).find(
                      r => r.tipo === source.tipo && r.tribunal === source.tribunal
                    );
                    const isSelected = !!existing;
                    return (
                      <div key={key} className={`rounded-md border px-3 py-2 ${isSelected ? 'border-emerald bg-emerald/5' : 'border-navy-border bg-navy-deep'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const current = editing.rag_config ?? [];
                                if (checked) {
                                  updateField('rag_config', [...current, { tipo: source.tipo, tribunal: source.tribunal, max_results: 3 }]);
                                } else {
                                  updateField('rag_config', current.filter(r => !(r.tipo === source.tipo && r.tribunal === source.tribunal)));
                                }
                              }}
                            />
                            <span className="text-sm text-light">{source.label}</span>
                          </label>
                          {isSelected && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-muted-foreground">Máx:</span>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={existing.max_results}
                                onChange={(e) => {
                                  const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                                  const current = editing.rag_config ?? [];
                                  updateField('rag_config', current.map(r =>
                                    r.tipo === source.tipo && r.tribunal === source.tribunal
                                      ? { ...r, max_results: val }
                                      : r
                                  ));
                                }}
                                className="w-14 text-center rounded border border-navy-border bg-navy-deep text-light text-sm px-1 py-0.5"
                              />
                              <span className="text-xs text-muted-foreground">resultados</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(editing.rag_config ?? []).length > 0 && (
                  <p className="text-xs text-emerald mt-2">
                    ✓ {(editing.rag_config ?? []).length} fonte(s) ativa(s) — total máx: {(editing.rag_config ?? []).reduce((s, r) => s + r.max_results, 0)} resultados por pergunta
                  </p>
                )}
              </div>

              <div>
                <Label className="text-muted-light">Max Completion Tokens</Label>
                <Input
                  type="number"
                  min={1000}
                  max={32000}
                  step={1000}
                  value={editing.max_completion_tokens ?? 8000}
                  onChange={(e) => updateField('max_completion_tokens', parseInt(e.target.value) || 8000)}
                  className="mt-1 border-navy-border bg-navy-deep text-light w-40"
                />
              </div>

              <div>
                <Label className="text-muted-light">Reasoning Effort</Label>
                <select
                  value={editing.reasoning_effort ?? 'none'}
                  onChange={(e) => updateField('reasoning_effort', e.target.value)}
                  className="mt-1 h-9 w-32 rounded-md border border-navy-border bg-navy-deep px-2 text-sm text-light"
                >
                  <option value="none">none</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">none = sem tokens de raciocínio oculto</p>
              </div>

              <div>
                <Label className="text-muted-light">Verbosity</Label>
                <select
                  value={editing.verbosity ?? 'low'}
                  onChange={(e) => updateField('verbosity', e.target.value)}
                  className="mt-1 h-9 w-32 rounded-md border border-navy-border bg-navy-deep px-2 text-sm text-light"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">Controla a extensão da resposta</p>
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
