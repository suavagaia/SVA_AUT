import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, CheckCircle, Lock, ExternalLink, ShoppingCart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SUPABASE_URL = 'https://lxteajwzovoeclbytdrp.supabase.co';
const MAX_TOKENS = 600_000;
const numFmt = new Intl.NumberFormat('pt-BR');
const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

interface TokenUsageEvent {
  id: string;
  created_at: string;
  tokens_charged: number;
  model_used: string;
  agents: { title: string } | null;
}

export default function BillingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [tokensRemaining, setTokensRemaining] = useState<number | null>(null);
  const [planInfo, setPlanInfo] = useState<{ role: string; subscription_status: string | null; subscription_tier: string | null } | null>(null);
  const [usageEvents, setUsageEvents] = useState<TokenUsageEvent[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const fetchTokens = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_token_balances')
      .select('agents_tokens_remaining')
      .eq('user_id', user.id)
      .single();
    setTokensRemaining(data?.agents_tokens_remaining ?? 0);
    setLoadingTokens(false);
  };

  const fetchPlan = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('role, subscription_status, subscription_plan')
      .eq('id', user.id)
      .single();
    setPlanInfo(data ? { role: data.role, subscription_status: data.subscription_status, subscription_tier: data.subscription_plan } : null);
    setLoadingPlan(false);
  };

  const fetchUsage = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('token_usage_events')
      .select('id, created_at, tokens_charged, model_used, agents (title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setUsageEvents((data as unknown as TokenUsageEvent[]) || []);
    setLoadingUsage(false);
  };

  useEffect(() => {
    if (user) {
      fetchTokens();
      fetchPlan();
      fetchUsage();
    }
  }, [user]);

  const handleSync = async () => {
    setSyncing(true);
    await fetchTokens();
    setSyncing(false);
    toast({ title: 'Saldo atualizado!' });
  };

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
    } finally {
      setPortalLoading(false);
    }
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
    } finally {
      setCreditsLoading(false);
    }
  };

  // Derived
  const tokenPct = tokensRemaining !== null ? Math.min((tokensRemaining / MAX_TOKENS) * 100, 100) : 0;
  const tokenBarColor = tokenPct < 10 ? 'bg-destructive' : tokenPct < 20 ? 'bg-yellow-500' : 'bg-emerald';
  const isSubscriber = planInfo?.subscription_status === 'active' || planInfo?.subscription_status === 'past_due';
  const tierLabel = planInfo?.subscription_tier === 'monthly' ? 'Mensal' : planInfo?.subscription_tier === 'annual' ? 'Anual' : 'Gratuito';
  const tierBadgeVariant = planInfo?.subscription_tier === 'monthly' ? 'default' : planInfo?.subscription_tier === 'annual' ? 'secondary' : 'outline';
  const statusLabel = planInfo?.subscription_status === 'active' ? 'Ativa' : planInfo?.subscription_status === 'past_due' ? 'Atrasada' : planInfo?.subscription_status === 'canceled' ? 'Cancelada' : null;
  const statusColor = planInfo?.subscription_status === 'active' ? 'bg-emerald text-primary-foreground' : planInfo?.subscription_status === 'past_due' ? 'bg-yellow-500 text-primary-foreground' : 'bg-destructive text-destructive-foreground';

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Meu Plano & Tokens</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Token Balance */}
          <Card className="bg-card border-border rounded-xl p-6 space-y-4">
            {loadingTokens ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Saldo de Tokens</h2>
                  <Badge variant={tierBadgeVariant as any}>{tierLabel}</Badge>
                </div>
                <div>
                  <span className="text-4xl font-bold text-emerald">{numFmt.format(tokensRemaining ?? 0)}</span>
                  <p className="text-sm text-muted-foreground mt-1">tokens disponíveis</p>
                </div>
                <Progress value={tokenPct} className="h-3" indicatorClassName={tokenBarColor} />
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
              </>
            )}
          </Card>

          {/* Plan Info */}
          <Card className="bg-card border-border rounded-xl p-6 space-y-4">
            {loadingPlan ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-10 w-48" />
              </div>
            ) : isSubscriber ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald" />
                  <h2 className="text-lg font-semibold text-foreground">Assinatura Ativa</h2>
                </div>
                <p className="text-muted-foreground">
                  {planInfo?.subscription_tier === 'monthly' ? 'Mensal — R$129/mês' : 'Anual — R$1.290/ano'}
                </p>
<div className="flex items-center gap-3 flex-wrap">
                {statusLabel && (
                  <Badge className={statusColor}>{statusLabel}</Badge>
                )}
                <Button onClick={handlePortal} disabled={portalLoading} className="bg-emerald hover:bg-emerald/90 text-primary-foreground">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {portalLoading ? 'Abrindo...' : 'Gerenciar no Stripe'}
                </Button>
              </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Plano Gratuito</h2>
                </div>
                <p className="text-muted-foreground">Acesso limitado ao agente de Mentoria</p>
                <Button onClick={() => navigate('/app/upgrade')} className="bg-emerald hover:bg-emerald/90 text-primary-foreground">
                  Assinar agora
                </Button>
              </>
            )}
          </Card>
        </div>

        {/* Buy Credits */}
        {isSubscriber && (
          <Card className="bg-card border-border rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Créditos Adicionais</h2>
                <p className="text-muted-foreground text-sm mt-1">600.000 tokens extras por R$49,90. Válidos por 12 meses.</p>
              </div>
              <Button onClick={handleBuyCredits} disabled={creditsLoading} className="bg-emerald hover:bg-emerald/90 text-primary-foreground shrink-0">
                <ShoppingCart className="mr-2 h-4 w-4" />
                {creditsLoading ? 'Processando...' : 'Comprar Créditos'}
              </Button>
            </div>
          </Card>
        )}

        {/* Usage History */}
        <Card className="bg-card border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Histórico de Uso</h2>
          {loadingUsage ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : usageEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma interação registrada ainda.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Agente</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageEvents.map((evt) => (
                      <TableRow key={evt.id}>
                        <TableCell className="text-sm">{dateFmt.format(new Date(evt.created_at))}</TableCell>
                        <TableCell className="text-sm">{evt.agents?.title || '—'}</TableCell>
                        <TableCell className="text-sm font-mono">{evt.model_used}</TableCell>
                        <TableCell className="text-sm text-right">{numFmt.format(evt.tokens_charged)}</TableCell>
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
