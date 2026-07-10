import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ModelPrice {
  id: string;
  provider: string;
  model: string;
  input_price_per_1m: number;
  cached_input_price_per_1m: number;
  output_price_per_1m: number;
  currency: string;
  active: boolean;
}

const PROVIDER_LABEL: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic / Claude',
  google: 'Google',
};

function fmt(v: number | null | undefined) {
  const n = Number(v ?? 0);
  if (!n) return '—';
  // até 3 casas para preços pequenos (cache), 2 casas para o resto
  return n < 0.1 ? n.toFixed(3) : n.toFixed(2);
}

export default function AdminPricingPage() {
  const [prices, setPrices] = useState<ModelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('llm_model_prices')
        .select('id, provider, model, input_price_per_1m, cached_input_price_per_1m, output_price_per_1m, currency, active')
        .order('provider')
        .order('input_price_per_1m');
      setPrices((data as ModelPrice[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const visible = prices.filter((p) => showInactive || p.active);
  const providers = Array.from(new Set(visible.map((p) => p.provider)));

  return (
    <AdminLayout>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl text-light">Preços dos modelos</h2>
          <p className="mt-1 text-sm text-muted-light">
            Tarifa <strong>Standard</strong>, por 1M de tokens (USD). Fonte:{' '}
            <code className="text-emerald">llm_model_prices</code> — a mesma tabela que
            alimenta o seletor de modelo dos agentes e o cálculo de custo.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-light">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-emerald"
          />
          Mostrar inativos
        </label>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => {
            const rows = visible.filter((p) => p.provider === provider);
            return (
              <Card key={provider} className="border-navy-border bg-navy">
                <CardHeader>
                  <CardTitle className="text-light">
                    {PROVIDER_LABEL[provider] ?? provider}
                    <span className="ml-2 text-sm font-normal text-muted-light">
                      {rows.length} modelo{rows.length === 1 ? '' : 's'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-navy-border text-left text-muted-light">
                          <th className="py-2 pr-4 font-medium">Modelo</th>
                          <th className="py-2 pr-4 text-right font-medium">Input</th>
                          <th className="py-2 pr-4 text-right font-medium">Cached input</th>
                          <th className="py-2 pr-4 text-right font-medium">Output</th>
                          <th className="py-2 pr-4 text-right font-medium">Moeda</th>
                          <th className="py-2 text-right font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p) => (
                          <tr
                            key={p.id}
                            className={`border-b border-navy-border/50 ${p.active ? '' : 'opacity-50'}`}
                          >
                            <td className="py-2 pr-4 font-mono text-light">{p.model}</td>
                            <td className="py-2 pr-4 text-right tabular-nums text-light">{fmt(p.input_price_per_1m)}</td>
                            <td className="py-2 pr-4 text-right tabular-nums text-muted-light">{fmt(p.cached_input_price_per_1m)}</td>
                            <td className="py-2 pr-4 text-right tabular-nums text-light">{fmt(p.output_price_per_1m)}</td>
                            <td className="py-2 pr-4 text-right text-muted-light">{p.currency}</td>
                            <td className="py-2 text-right">
                              {p.active ? (
                                <span className="rounded bg-emerald/15 px-2 py-0.5 text-xs text-emerald">ativo</span>
                              ) : (
                                <span className="rounded bg-navy-border px-2 py-0.5 text-xs text-muted-light">inativo</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-light">
        Valores em USD por 1M de tokens (tarifa Standard da API). Preços de Batch, Flex e
        Priority da OpenAI não são refletidos aqui — os agentes usam a API Standard. Para
        editar preços, altere <code className="text-emerald">llm_model_prices</code>.
      </p>
    </AdminLayout>
  );
}
