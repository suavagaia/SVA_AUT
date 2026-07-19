import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, CheckCircle, Lock, ExternalLink, ShoppingCart, Repeat, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SUPABASE_URL = 'https://lxteajwzovoeclbytdrp.supabase.co';
const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const DAY_MS = 86400000;

const TIER_NAME: Record<string, string> = {
  foco_monthly: 'Foco — Mensal', foco_semestral: 'Foco — Semestral', foco_annual: 'Foco — Anual',
  multi_monthly: 'Multiconcurso — Mensal', multi_semestral: 'Multiconcurso — Semestral', multi_annual: 'Multiconcurso — Anual',
  ilimitado_monthly: 'Passaporte — Mensal', ilimitado_semestral: 'Passaporte — Semestral', ilimitado_annual: 'Passaporte — Anual',
};
// Valor cheio mensal por escopo (para o aviso de renovação do Foco).
const FULL_MONTHLY: Record<string, number> = { foco: 69.90, multi: 129.90, ilimitado: 199.90 };

interface TokenUsageEvent {
  id: string;
  created_at: string;
  model_used: string;
  agents?: { title: string } | null;
}

interface PlanState {
  role: string;
  status: string | null;
  tier: string | null;
  scope: string | null;
  cap: number | null;
  monthlyCost: number;
  subStart: string | null;
}

export default function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<PlanState | null>(null);
  const [usageEvents, setUsageEvents] = useState<TokenUsageEvent[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const fetchPlan = async () => {
    if (!user) return;
    const [{ data: prof }, { data: u }, { data: bal }] = await Promise.all([
      supabase.from('user_profiles').select('role, subscription_status').eq('id', user.id).single(),
      supabase.from('users').select('subscription_tier, subscription_start, plan_scope, monthly_cost_cap_brl').eq('id', user.id).single(),
      supabase.from('user_token_balances').select('monthly_cost_brl').eq('user_id', user.id).single(),
    ]);
    setPlan({
      role: prof?.role ?? 'free_user',
      status: prof?.subscription_status ?? null,
      tier: u?.subscription_tier ?? null,
      scope: u?.plan_scope ?? null,
      cap: u?.monthly_cost_cap_brl != null ? Number(u.monthly_cost_cap_brl) : null,
      monthlyCost: Number(bal?.monthly_cost_brl ?? 0),
      subStart: u?.subscription_start ?? null,
    });
    setLoadingPlan(false);
  };

  const fetchUsage = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('token_usage_events')
      .select('id, created_at, model_used, agents(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setUsageEvents((data as unknown as TokenUsageEvent[]) || []);
    setLoadingUsage(false);
  };

  useEffect(() => {
    if (user) { fetchPlan(); fetchUsage(); }
  }, [user]);

  const handleSync = async () => { setSyncing(true); await fetchPlan(); setSyncing(false); toast({ title: 'Atualizado!' }); };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) { toast({ title: 'Sessão expirada.', variant: 'destructive' }); return; }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ return_url: window.location.href }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
      else toast({ title: 'Erro ao abrir portal.', variant: 'destructive' });
    } catch {
      toast({ title: 'Erro ao abrir portal.', variant: 'destructive' });
    } finally { setPortalLoading(false); }
  };

  const handleBuyCredits = async () => {
    setCreditsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) { toast({ title: 'Sessão expirada.', variant: 'destructive' }); return; }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({
          price_id: 'price_1SAwTuGmx6vYOM03G4nuqdbQ',
          success_url: `${window.location.origin}/thank-you/credits`,
          cancel_url: `${window.location.origin}/app/billing`,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast({ title: 'Erro ao iniciar compra.', variant: 'destructive' });
    } catch {
      toast({ title: 'Erro ao iniciar compra.', variant: 'destructive' });
    } finally { setCreditsLoading(false); }
  };

  const isAdmin = plan?.role === 'admin';
  const isSubscriber = isAdmin || plan?.status === 'active' || plan?.status === 'past_due' || plan?.role === 'subscriber';
  const planName = plan?.tier ? (TIER_NAME[plan.tier] ?? 'Assinante') : 'Assinante';

  // Uso Justo: % do teto do ciclo consumido
  const cap = plan?.cap ?? null;
  const usedPct = cap && cap > 0 ? Math.min(100, Math.round((plan!.monthlyCost / cap) * 100)) : null;
  const barColor = usedPct != null && usedPct >= 95 ? 'bg-destructive' : usedPct != null && usedPct >= 80 ? 'bg-yellow-500' : 'bg-emerald';

  // Aviso do Foco: renovação de preço a partir do dia 25 do 1º mês
  const subStartMs = plan?.subStart ? new Date(plan.subStart).getTime() : 0;
  const daysSinceStart = subStartMs ? (Date.now() - subStartMs) / DAY_MS : 0;
  const showFocoRenewal = plan?.scope === 'foco' && daysSinceStart >= 25 && daysSinceStart < 32;
  const focoRenewalDate = subStartMs ? dateFmt.format(new Date(subStartMs + 30 * DAY_MS)) : '';

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Minha Assinatura</h1>

        {/* Banner de renovação do Foco (dia 25+) */}
        {showFocoRenewal && (
          <div className="flex gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <Info className="h-5 w-5 shrink-0 text-yellow-500" />
            <p className="text-sm text-card-foreground">
              Seu plano Foco renova em <strong>{focoRenewalDate}</strong> por <strong>R$ 69,90/mês</strong>, cobrado
              automaticamente. Você pode cancelar ou trocar de plano a qualquer momento aqui.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Uso Justo do ciclo */}
          <Card className="bg-card border-border rounded-xl p-6 space-y-4">
            {loadingPlan ? (
              <div className="space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-12 w-48" /><Skeleton className="h-4 w-full" /></div>
            ) : usedPct != null ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Uso do ciclo</h2>
                  <Badge variant="outline">Uso Justo</Badge>
                </div>
                <div>
                  <span className="text-4xl font-bold text-emerald">{usedPct}%</span>
                  <p className="text-sm text-muted-foreground mt-1">do limite do ciclo utilizado</p>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${usedPct}%` }} />
                </div>
                {usedPct >= 100 ? (
                  <p className="text-sm text-destructive">Limite do ciclo atingido. Compre créditos para uso imediato ou aguarde a renovação.</p>
                ) : usedPct >= 80 ? (
                  <p className="text-sm text-yellow-500">Você usou {usedPct}% do limite deste ciclo.</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  O uso é limitado a 25% do valor do plano por ciclo.{' '}
                  <Link to="/politica-uso-justo" className="underline">Política de Uso Justo</Link>.
                </p>
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Atualizar
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-foreground">Uso do ciclo</h2>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? 'Conta de administrador — sem limite de uso.' : 'Assine um plano para acompanhar seu uso aqui.'}
                </p>
              </>
            )}
          </Card>

          {/* Assinatura */}
          <Card className="bg-card border-border rounded-xl p-6 space-y-4">
            {loadingPlan ? (
              <div className="space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-8 w-56" /><Skeleton className="h-10 w-48" /></div>
            ) : isSubscriber ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald" />
                  <h2 className="text-lg font-semibold text-foreground">Assinatura ativa</h2>
                </div>
                <p className="text-muted-foreground">{planName}</p>
                {plan?.status === 'past_due' && <Badge className="bg-yellow-500 text-primary-foreground">Pagamento atrasado</Badge>}
                {!isAdmin && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={handlePortal} disabled={portalLoading} className="bg-emerald hover:bg-emerald/90 text-primary-foreground">
                      <ExternalLink className="mr-2 h-4 w-4" /> {portalLoading ? 'Abrindo...' : 'Gerenciar / cancelar'}
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/app/upgrade')}>
                      <Repeat className="mr-2 h-4 w-4" /> Trocar de plano
                    </Button>
                    {plan?.scope === 'multi' && (
                      <Button variant="outline" onClick={() => navigate('/app/meus-concursos')}>Meus concursos</Button>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Renovação automática até o cancelamento. Cancele quando quiser, sem multa — o acesso permanece até o fim do ciclo pago.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Plano Gratuito</h2>
                </div>
                <p className="text-muted-foreground">Acesso limitado. Assine para liberar os agentes.</p>
                <Button onClick={() => navigate('/app/upgrade')} className="bg-emerald hover:bg-emerald/90 text-primary-foreground">
                  Ver planos
                </Button>
              </>
            )}
          </Card>
        </div>

        {/* Comprar mais */}
        {isSubscriber && (
          <Card className="bg-card border-border rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Comprar mais</h2>
                <p className="text-muted-foreground text-sm mt-1">Créditos adicionais para uso imediato ao atingir o limite do ciclo — R$ 49,90.</p>
              </div>
              <Button onClick={handleBuyCredits} disabled={creditsLoading} className="bg-emerald hover:bg-emerald/90 text-primary-foreground shrink-0">
                <ShoppingCart className="mr-2 h-4 w-4" /> {creditsLoading ? 'Processando...' : 'Comprar mais'}
              </Button>
            </div>
          </Card>
        )}

        {/* Histórico */}
        <Card className="bg-card border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Histórico de Uso</h2>
          {loadingUsage ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : usageEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma interação registrada ainda.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Data</TableHead><TableHead>Agente</TableHead><TableHead>Modelo</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageEvents.map((evt) => (
                      <TableRow key={evt.id}>
                        <TableCell className="text-sm">{dateFmt.format(new Date(evt.created_at))}</TableCell>
                        <TableCell className="text-sm">{evt.agents?.title || '—'}</TableCell>
                        <TableCell className="text-sm font-mono">{evt.model_used}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground text-center">Exibindo os últimos 50 registros</p>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
