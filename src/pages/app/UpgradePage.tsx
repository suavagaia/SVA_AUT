import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useNativePlatform } from '@/hooks/useNativePlatform';

const PRICE_MONTHLY_1M = 'price_1TP8QgGmx6vYOM03RiFKAp9B';
const PRICE_ANNUAL_1M  = 'price_1TP8QqGmx6vYOM03ZwLhA6Ne';
const SUPABASE_URL = 'https://lxteajwzovoeclbytdrp.supabase.co';

export default function UpgradePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'mensal' | 'anual'>('mensal');
  const [loading, setLoading] = useState(false);
  const { isNative } = useNativePlatform();

  // iOS/Android: Apple não permite checkout externo no app.
  // Exibir tela informativa — usuário assina pelo site.
  if (isNative) {
    return (
      <AppLayout>
        <div className="max-w-sm mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald/10 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-emerald" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Assine pelo site</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Para assinar o Sua Vaga IA, acesse{' '}
              <span className="text-emerald font-medium">suavagaia.com.br</span>{' '}
              pelo seu navegador. Após assinar, volte ao app e acesse normalmente.
            </p>
          </div>
          <div className="w-full space-y-3">
            {[
              '1.000.000 tokens por mês',
              'Todos os agentes especializados',
              'STF, STJ e TST atualizados',
              'Mentoria e cronograma personalizados',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-left">
                <CheckCircle className="h-4 w-4 text-emerald shrink-0" />
                <span className="text-sm text-card-foreground">{f}</span>
              </div>
            ))}
          </div>
          <Card className="w-full bg-card border-border p-4 rounded-xl">
            <p className="text-xs text-muted-foreground">
              🌐 <span className="font-medium text-foreground">suavagaia.com.br</span>
              {'\n'}Planos a partir de R$ 129/mês
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const storageKey = 'sb-lxteajwzovoeclbytdrp-auth-token';
      const raw = localStorage.getItem(storageKey);
      const accessToken = raw ? JSON.parse(raw)?.access_token : null;
      if (!accessToken) { navigate('/auth/login'); return; }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/thank-you/monthly`,
          cancel_url: `${window.location.origin}/app/upgrade`,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error('Erro ao iniciar checkout. Tente novamente.');
    } catch {
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    '1.000.000 tokens por mês',
    'Todos os 17 agentes especializados',
    'Informativos STF/STJ/TST atualizados',
    'Súmulas e OJs com casos práticos',
    'Mentoria e cronograma personalizados',
    'Questões objetivas e certo/errado',
    'Respostas em áudio e impressão',
    'Cancele a qualquer momento',
  ];

  return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-bold text-foreground">Assine o Sua Vaga IA</h1>
          <p className="text-muted-foreground">Preparação completa para concursos públicos</p>
        </div>

        {/* Tab mensal / anual */}
        <div className="flex justify-center">
          <div className="inline-flex gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setTab('mensal')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'mensal' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >Mensal</button>
            <button
              onClick={() => setTab('anual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'anual' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >Anual — economize 16%</button>
          </div>
        </div>

        <Card className="bg-card border-border rounded-xl p-6 space-y-6">
          <div className="text-center space-y-1">
            <div className="text-4xl font-bold text-emerald">
              {tab === 'mensal' ? 'R$ 129' : 'R$ 1.299'}
            </div>
            <div className="text-sm text-muted-foreground">
              {tab === 'mensal' ? '/mês' : '/ano — ≈ R$ 108,25/mês'}
            </div>
          </div>

          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                <span className="text-sm text-card-foreground">{f}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={() => handleCheckout(tab === 'mensal' ? PRICE_MONTHLY_1M : PRICE_ANNUAL_1M)}
            disabled={loading}
            className="w-full bg-emerald hover:bg-emerald/90 text-primary-foreground"
          >
            {loading ? 'Processando...' : tab === 'mensal' ? 'Assinar por R$ 129/mês' : 'Assinar por R$ 1.299/ano'}
          </Button>

          {tab === 'anual' && (
            <p className="text-xs text-center text-muted-foreground">
              Planos anuais aceitam Cartão, Boleto e PIX
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Sem fidelidade — cancele quando quiser
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
