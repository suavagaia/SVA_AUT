const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/pages/admin/PromptsPage.tsx');
let s = fs.readFileSync(file, 'utf8');

function mustReplace(from, to, label) {
  if (!s.includes(from)) {
    console.error(`[patch-admin-provider-visibility] target not found: ${label}`);
    process.exit(1);
  }
  s = s.replace(from, to);
}

if (s.includes('Campos OpenAI-only ficam ocultos para Claude')) {
  console.log('[patch-admin-provider-visibility] already applied');
  process.exit(0);
}

mustReplace(
`              <div className="flex items-center justify-between">
                <Label className="text-muted-light">Web Search</Label>
                <Switch checked={editing.tool_web_search} onCheckedChange={(v) => updateField('tool_web_search', v)} />
              </div>`,
`              {editing.model_provider === 'openai' ? (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-muted-light">Web Search</Label>
                    <p className="text-xs text-muted-foreground">Campo OpenAI-only. Não é usado por Claude.</p>
                  </div>
                  <Switch checked={editing.tool_web_search} onCheckedChange={(v) => updateField('tool_web_search', v)} />
                </div>
              ) : (
                <div className="rounded-md border border-navy-border bg-navy-deep px-3 py-2 text-xs text-muted-foreground">
                  Web Search oculto: Claude usa apenas o contexto enviado pela função. Para base jurídica, use Supabase RAG abaixo.
                </div>
              )}`,
'web search provider visibility'
);

mustReplace(
`              <div>
                <Label className="text-muted-light">Supabase RAG</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  Selecione as fontes de jurisprudência e defina quantos resultados buscar de cada uma.
                </p>`,
`              <div>
                <Label className="text-muted-light">Supabase RAG</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  Provider-agnóstico: a função busca no Supabase e envia o contexto para OpenAI ou Claude.
                </p>`,
'rag provider-agnostic copy'
);

mustReplace(
`              <div>
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
              </div>`,
`              {editing.model_provider === 'openai' && (
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
                  <p className="mt-1 text-xs text-muted-foreground">OpenAI-only. Campos OpenAI-only ficam ocultos para Claude.</p>
                </div>
              )}`,
'reasoning openai only'
);

mustReplace(
`              <div>
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
              </div>`,
`              {editing.model_provider === 'openai' && (
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
                  <p className="mt-1 text-xs text-muted-foreground">OpenAI-only. Claude não usa este parâmetro.</p>
                </div>
              )}`,
'verbosity openai only'
);

fs.writeFileSync(file, s);
console.log('[patch-admin-provider-visibility] applied');
