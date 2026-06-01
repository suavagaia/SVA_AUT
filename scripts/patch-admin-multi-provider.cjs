const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/pages/admin/PromptsPage.tsx');
let s = fs.readFileSync(file, 'utf8');

function mustReplace(from, to, label) {
  if (!s.includes(from)) {
    console.error(`[patch-admin-multi-provider] target not found: ${label}`);
    process.exit(1);
  }
  s = s.replace(from, to);
}

if (s.includes('interface LLMModelPrice')) {
  console.log('[patch-admin-multi-provider] already applied');
  process.exit(0);
}

mustReplace(
`  model: string;
  effort: string;`,
`  model_provider: 'openai' | 'anthropic' | 'google';
  model: string;
  provider_config?: Record<string, unknown> | null;
  temperature?: number | null;
  effort: string;`,
'agent type provider fields'
);

mustReplace(
`  subject_id: string | null;
}

interface RagConfigItem {`,
`  subject_id: string | null;
}

interface LLMModelPrice {
  id: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  input_price_per_1m: number;
  output_price_per_1m: number;
  active: boolean;
}

interface RagConfigItem {`,
'LLMModelPrice type'
);

mustReplace(
`  const [editingSubjectIds, setEditingSubjectIds] = useState<string[]>([]);`,
`  const [editingSubjectIds, setEditingSubjectIds] = useState<string[]>([]);
  const [llmModelPrices, setLlmModelPrices] = useState<LLMModelPrice[]>([]);`,
'prices state'
);

mustReplace(
`.select('id, title, slug, model, effort, is_active, display_order, system_prompt, tool_web_search, tool_file_search, tool_file_search_vector_store_ids, file_search_max_results, verbosity, response_format, max_completion_tokens, use_supabase_rag, supabase_rag_table, rag_config, subject_id, reasoning_effort')`,
`.select('id, title, slug, model_provider, model, provider_config, temperature, effort, is_active, display_order, system_prompt, tool_web_search, tool_file_search, tool_file_search_vector_store_ids, file_search_max_results, verbosity, response_format, max_completion_tokens, use_supabase_rag, supabase_rag_table, rag_config, subject_id, reasoning_effort')`,
'agent select provider fields'
);

mustReplace(
`    setAgents((data as Agent[]) ?? []);`,
`    setAgents(((data as Agent[]) ?? []).map(a => ({ ...a, model_provider: a.model_provider ?? 'openai' })));`,
'agent provider default'
);

mustReplace(
`  // Fetch areas, contests, subjects for the subject selector`,
`  const fetchLlmModelPrices = async () => {
    const { data } = await supabase
      .from('llm_model_prices')
      .select('id, provider, model, input_price_per_1m, output_price_per_1m, active')
      .eq('active', true)
      .order('provider')
      .order('model');
    setLlmModelPrices((data as LLMModelPrice[]) ?? []);
  };

  // Fetch areas, contests, subjects for the subject selector`,
'fetch llm prices'
);

mustReplace(
`useEffect(() => { fetchAgents(); fetchMentoriaPrompt(); fetchManual(); fetchMentoriaLimit(); }, []);`,
`useEffect(() => { fetchAgents(); fetchLlmModelPrices(); fetchMentoriaPrompt(); fetchManual(); fetchMentoriaLimit(); }, []);`,
'initial fetch llm prices'
);

mustReplace(
`      system_prompt: editing.system_prompt,
      model: editing.model,
      effort: editing.effort,`,
`      system_prompt: editing.system_prompt,
      model_provider: editing.model_provider ?? 'openai',
      model: editing.model,
      provider_config: editing.provider_config ?? {},
      temperature: editing.temperature ?? null,
      effort: editing.effort,`,
'save provider fields'
);

mustReplace(
`  const updateField = <K extends keyof Agent>(key: K, value: Agent[K]) => {
    setEditing((prev) => prev ? { ...prev, [key]: value } : null);
  };

  return (`,
`  const updateField = <K extends keyof Agent>(key: K, value: Agent[K]) => {
    setEditing((prev) => prev ? { ...prev, [key]: value } : null);
  };

  const providerLabels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic / Claude',
    google: 'Google',
  };

  const getModelsForProvider = (provider?: string) => llmModelPrices.filter(m => m.provider === (provider ?? 'openai'));

  return (`,
'provider helpers'
);

mustReplace(
`<th className="pb-2 pr-4">Modelo</th>
                  <th className="pb-2 pr-4">Max Tokens</th>`,
`<th className="pb-2 pr-4">Provider</th>
                  <th className="pb-2 pr-4">Modelo</th>
                  <th className="pb-2 pr-4">Max Tokens</th>`,
'table header'
);

mustReplace(
`<td className="py-2 pr-4 text-muted-light">{a.slug}</td>
                    <td className="py-2 pr-4">{a.model}</td>
                    <td className="py-2 pr-4">{a.max_completion_tokens ?? 8000}</td>`,
`<td className="py-2 pr-4 text-muted-light">{a.slug}</td>
                    <td className="py-2 pr-4">{providerLabels[a.model_provider ?? 'openai'] ?? a.model_provider ?? 'openai'}</td>
                    <td className="py-2 pr-4">{a.model}</td>
                    <td className="py-2 pr-4">{a.max_completion_tokens ?? 8000}</td>`,
'table row'
);

mustReplace(
`              <div>
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
              </div>`,
`              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-light">Provider</Label>
                  <Select value={editing.model_provider ?? 'openai'} onValueChange={(v) => {
                    const provider = v as Agent['model_provider'];
                    const firstModel = getModelsForProvider(provider)[0]?.model ?? editing.model;
                    setEditing(prev => prev ? { ...prev, model_provider: provider, model: firstModel } : prev);
                  }}>
                    <SelectTrigger className="mt-1 border-navy-border bg-navy-deep text-light"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic / Claude</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">Escolha interna. O aluno não vê.</p>
                </div>
                <div>
                  <Label className="text-muted-light">Modelo</Label>
                  <Select value={editing.model} onValueChange={(v) => updateField('model', v)}>
                    <SelectTrigger className="mt-1 border-navy-border bg-navy-deep text-light"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {getModelsForProvider(editing.model_provider).map((m) => (
                        <SelectItem key={m.id} value={m.model}>{m.model} — in {Number(m.input_price_per_1m).toFixed(2)} / out {Number(m.output_price_per_1m).toFixed(2)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">Modelos vêm de llm_model_prices.</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-light">Temperatura</Label>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={editing.temperature ?? ''}
                  onChange={(e) => updateField('temperature', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Padrão do provider"
                  className="mt-1 border-navy-border bg-navy-deep text-light w-40"
                />
                <p className="mt-1 text-xs text-muted-foreground">Vazio usa o padrão seguro da função.</p>
              </div>`,
'model selector'
);

fs.writeFileSync(file, s);
console.log('[patch-admin-multi-provider] applied');
