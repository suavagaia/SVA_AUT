import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Check, Lock, Zap, X } from 'lucide-react';
import { toast } from 'sonner';

// Plano 600k
const PRICE_MONTHLY_600K = 'price_1TP8QLGmx6vYOM03CLWb2x9H';
const PRICE_ANNUAL_600K  = 'price_1TP8QVGmx6vYOM03Fgvf6Urk';
// Plano 1M
const PRICE_MONTHLY_1M   = 'price_1TP8QgGmx6vYOM03RiFKAp9B';
const PRICE_ANNUAL_1M    = 'price_1TP8QqGmx6vYOM03ZwLhA6Ne';

export default function UpgradePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async (priceId: string, plan: string) => {
    try {
      const storageKey = 'sb-lxteajwzovoeclbytdrp-auth-token';
      const raw = localStorage.getItem(storageKey);
      const accessToken = raw ? JSON.parse(raw)?.access_token : null;

      if (!accessToken) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          price_id: priceId,
          success_url: `${window.location.origin}/thank-you/${plan}`,
          cancel_url: `${window.location.origin}/app/upgrade`,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    }
  };

  const features600k = [
    '600.000 tokens por mês',
    'Acesso a todos os agentes especializados',
    'Informativos STF/STJ atualizados',
    'Súmulas com casos práticos',
    'Cancele a qualquer momento',
  ];

  const features1m = [
    '1.000.000 tokens por mês',
    'Acesso a todos os agentes especializados',
    'Informativos STF/STJ atualizados',
    'Súmulas com casos práticos',
    'Melhor custo por pergunta',
    'Cancele a qualquer momento',
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
          <Zap size={14} /> Plano Gratuito Ativo
        </div>

        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          Faça Upgrade para Acesso Completo
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Escolha o plano ideal para sua preparação. Cancele quando quiser.
        </p>

        <p className="mt-4 text-sm text-muted-foreground">
          Seus tokens atuais: <strong className="text-foreground">{profile?.tokens_remaining || 0} tokens</strong>
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* 600k Mensal */}
          <div className="relative rounded-lg border border-border bg-card p-6 text-left">
            <h3 className="font-display text-lg text-card-foreground">600k · Mensal</h3>
            <p className="mt-1 text-xs text-muted-foreground">ou R$999/ano</p>
            <div className="mt-4">
              <span className="font-display text-3xl text-card-foreground">R$ 99</span>
              <span className="text-muted-foreground text-sm">/mês</span>
            </div>
            <ul className="mt-6 space-y-2">
              {features600k.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-card-foreground">
                  <Check size={13} className="mt-0.5 shrink-0 text-emerald" /> {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout(PRICE_MONTHLY_600K, 'monthly')}
              variant="outline"
              className="mt-6 w-full font-semibold text-sm"
            >
              Assinar 600k →
            </Button>
          </div>

          {/* 600k Anual */}
          <div className="relative rounded-lg border border-border bg-card p-6 text-left">
            <div className="absolute -top-3 left-4 rounded-full bg-emerald/10 px-3 py-0.5 text-xs font-bold text-emerald">
              Economize R$189
            </div>
            <h3 className="font-display text-lg text-card-foreground">600k · Anual</h3>
            <p className="mt-1 text-xs text-muted-foreground">≈ R$83,25/mês</p>
            <div className="mt-4">
              <span className="font-display text-3xl text-card-foreground">R$ 999</span>
              <span className="text-muted-foreground text-sm">/ano</span>
            </div>
            <ul className="mt-6 space-y-2">
              {['600.000 tokens por ciclo', 'Todos os benefícios do 600k Mensal', 'Economia de R$189 vs mensal', 'Acesso por 12 meses'].map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-card-foreground">
                  <Check size={13} className="mt-0.5 shrink-0 text-emerald" /> {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout(PRICE_ANNUAL_600K, 'annual')}
              variant="outline"
              className="mt-6 w-full font-semibold text-sm"
            >
              Assinar 600k Anual →
            </Button>
          </div>

          {/* 1M Mensal — Mais Popular */}
          <div className="relative rounded-lg border-2 border-emerald bg-card p-6 text-left">
            <div className="absolute -top-3 left-4 rounded-full bg-emerald px-3 py-0.5 text-xs font-bold text-primary-foreground">
              Mais Popular
            </div>
            <h3 className="font-display text-lg text-card-foreground">1M · Mensal</h3>
            <p className="mt-1 text-xs text-muted-foreground">ou R$1.290/ano</p>
            <div className="mt-4">
              <span className="font-display text-3xl text-card-foreground">R$ 129</span>
              <span className="text-muted-foreground text-sm">/mês</span>
            </div>
            <ul className="mt-6 space-y-2">
              {features1m.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-card-foreground">
                  <Check size={13} className="mt-0.5 shrink-0 text-emerald" /> {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout(PRICE_MONTHLY_1M, 'monthly')}
              className="mt-6 w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold text-sm"
            >
              Assinar 1M →
            </Button>
          </div>

          {/* 1M Anual — Melhor Custo-Benefício */}
          <div className="relative rounded-lg border border-border bg-card p-6 text-left">
            <div className="absolute -top-3 left-4 rounded-full bg-emerald/10 px-3 py-0.5 text-xs font-bold text-emerald">
              Melhor Custo-Benefício
            </div>
            <h3 className="font-display text-lg text-card-foreground">1M · Anual</h3>
            <p className="mt-1 text-xs text-muted-foreground">≈ R$107,50/mês</p>
            <div className="mt-4">
              <span className="font-display text-3xl text-card-foreground">R$ 1.290</span>
              <span className="text-muted-foreground text-sm">/ano</span>
            </div>
            <ul className="mt-6 space-y-2">
              {['1.000.000 tokens por ciclo', 'Todos os benefícios do 1M Mensal', 'Economia de R$258 vs mensal', 'Acesso por 12 meses'].map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-card-foreground">
                  <Check size={13} className="mt-0.5 shrink-0 text-emerald" /> {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout(PRICE_ANNUAL_1M, 'annual')}
              variant="outline"
              className="mt-6 w-full font-semibold text-sm"
            >
              Assinar 1M Anual →
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Lock size={14} /> Pagamento Seguro via Stripe</span>
          <span className="flex items-center gap-1"><Zap size={14} /> Ativação Imediata</span>
          <span className="flex items-center gap-1"><X size={14} /> Cancele Quando Quiser</span>
        </div>
      </div>
    </AppLayout>
  );
}
