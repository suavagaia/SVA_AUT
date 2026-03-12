import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Check, Lock, Zap, X } from 'lucide-react';
import { toast } from 'sonner';

const PRICE_MONTHLY = 'price_1SUXQFGmx6vYOM03NfHHL89v';
const PRICE_ANNUAL = 'price_1SUXRUGmx6vYOM03MTVtneoX';

export default function UpgradePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async (priceId: string, plan: 'monthly' | 'annual') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          price_id: priceId,
          success_url: `${window.location.origin}/thank-you/${plan}`,
          cancel_url: `${window.location.origin}/app/upgrade`,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    }
  };

  const monthlyFeatures = [
    '600.000 tokens por mês',
    'Acesso a todos os agentes especializados',
    'Mentoria personalizada',
    'Suporte prioritário',
    'Renovação automática mensal',
  ];

  const annualFeatures = [
    'Tudo do plano mensal',
    'Economia de R$258 por ano',
    'Prioridade em novos recursos',
    'Suporte VIP',
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
          <Zap size={14} /> Plano Gratuito Ativo
        </div>

        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          Faça Upgrade para Acesso Completo
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Desbloqueie todo o potencial do Sua Vaga IA com mais tokens e recursos exclusivos.
        </p>

        <p className="mt-4 text-sm text-muted-foreground">
          Seus tokens atuais: <strong className="text-foreground">{profile?.tokens_remaining || 0} tokens</strong>
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* Monthly Card */}
          <div className="relative rounded-lg border-2 border-emerald bg-card p-6 text-left">
            <div className="absolute -top-3 left-6 rounded-full bg-emerald px-3 py-0.5 text-xs font-bold text-primary-foreground">
              Mais Popular
            </div>
            <h3 className="font-display text-xl text-card-foreground">Plano Mensal</h3>
            <p className="mt-1 text-sm text-muted-foreground">Acesso completo à plataforma</p>
            <div className="mt-4">
              <span className="font-display text-4xl text-card-foreground">R$ 129</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <ul className="mt-6 space-y-3">
              {monthlyFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-card-foreground">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald" /> {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout(PRICE_MONTHLY, 'monthly')}
              className="mt-6 w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold"
            >
              Assinar Agora →
            </Button>
          </div>

          {/* Annual Card */}
          <div className="relative rounded-lg border border-border bg-card p-6 text-left">
            <div className="absolute -top-3 left-6 rounded-full bg-emerald/10 px-3 py-0.5 text-xs font-bold text-emerald">
              Economize R$258
            </div>
            <h3 className="font-display text-xl text-card-foreground">Plano Anual</h3>
            <p className="mt-1 text-sm text-muted-foreground">Economize 2 meses!</p>
            <div className="mt-4">
              <span className="font-display text-4xl text-card-foreground">R$ 1.290</span>
              <span className="text-muted-foreground">/ano</span>
            </div>
            <ul className="mt-6 space-y-3">
              {annualFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-card-foreground">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald" /> {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout(PRICE_ANNUAL, 'annual')}
              variant="outline"
              className="mt-6 w-full font-semibold"
            >
              Assinar Agora →
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
