import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CheckCircle, Smartphone, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useNativePlatform } from '@/hooks/useNativePlatform';

// Price IDs (Stripe live)
const PRICES = {
  full:   { mensal: 'price_1TP8QgGmx6vYOM03RiFKAp9B', anual: 'price_1TP8QqGmx6vYOM03ZwLhA6Ne' },
  single: { mensal: 'price_1TqwF2Gmx6vYOM03sdCv8gTV', anual: 'price_1TqwF7Gmx6vYOM03ovarwD1p' },
} as const;

type Period = 'mensal' | 'anual';

interface Contest {
  id: string;
  name: string;
  slug: string;
}

const FULL_FEATURES = [
  'Acesso a TODOS os concursos',
  'Todos os agentes especializados',
  'Informativos STF/STJ/TST atualizados',
  'Súmulas e OJs com casos práticos',
  'Mentoria e cronograma personalizados',
  'Questões objetivas e certo/errado',
  'Respostas em áudio e impressão',
];

const SINGLE_FEATURES = [
  'Acesso a 1 concurso à sua escolha',
  'Todos os agentes daquele concurso',
  'Informativos STF/STJ/TST atualizados',
  'Súmulas e OJs com casos práticos',
  'Mentoria e cronograma personalizados',
  'Respostas em áudio e impressão',
];

export default function UpgradePage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('mensal');
  const [loading, setLoading] = useState<'full' | 'single' | null>(null);
  const { isNative } = useNativePlatform();

  // Single plan: contest picker
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState('');
  const [contestOpen, setContestOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('contests')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('display_order')
      .order('name')
      .then(({ data }) => setContests((data as Contest[]) ?? []));
  }, []);

  const selectedContest = contests.find((c) => c.id === selectedContestId);

  // iOS/Android: Apple não permite checkout externo no app.
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
          <Card className="w-full bg-card border-border p-4 rounded-xl">
            <p className="text-xs text-muted-foreground">
              🌐 <span className="font-medium text-foreground">suavagaia.com.br</span>
              {'\n'}Planos a partir de R$ 79/mês
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleCheckout = async (plan: 'full' | 'single') => {
    if (plan === 'single' && !selectedContestId) {
      toast.error('Selecione o concurso do seu plano.');
      return;
    }

    setLoading(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) { navigate('/auth/login'); return; }

      const successPath = period === 'anual' ? '/thank-you/annual' : '/thank-you/monthly';
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          price_id: PRICES[plan][period],
          ...(plan === 'single' ? { contest_id: selectedContestId } : {}),
          success_url: `${window.location.origin}${successPath}`,
          cancel_url: `${window.location.origin}/app/upgrade`,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else toast.error('Erro ao iniciar checkout. Tente novamente.');
    } catch {
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const fullPrice = period === 'mensal' ? 'R$ 129' : 'R$ 1.290';
  const fullSub = period === 'mensal' ? '/mês' : '/ano — ≈ R$ 107,50/mês';
  const singlePrice = period === 'mensal' ? 'R$ 79' : 'R$ 790';
  const singleSub = period === 'mensal' ? '/mês' : '/ano — ≈ R$ 65,83/mês';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-bold text-foreground">Escolha seu plano</h1>
          <p className="text-muted-foreground">Preparação completa para concursos públicos</p>
        </div>

        {/* Toggle mensal / anual */}
        <div className="flex justify-center">
          <div className="inline-flex gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setPeriod('mensal')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === 'mensal' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >Mensal</button>
            <button
              onClick={() => setPeriod('anual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === 'anual' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >Anual — economize ~17%</button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Plano FULL */}
          <Card className="bg-card border-emerald/40 rounded-xl p-6 space-y-6 flex flex-col relative">
            <div className="absolute -top-3 left-6 bg-emerald text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              Mais completo
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-foreground">Plano Completo</h2>
              <p className="text-sm text-muted-foreground">Todos os concursos disponíveis</p>
            </div>
            <div>
              <span className="text-4xl font-bold text-emerald">{fullPrice}</span>
              <span className="text-sm text-muted-foreground ml-1">{fullSub}</span>
            </div>
            <ul className="space-y-3 flex-1">
              {FULL_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span className="text-sm text-card-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout('full')}
              disabled={loading !== null}
              className="w-full bg-emerald hover:bg-emerald/90 text-primary-foreground"
            >
              {loading === 'full' ? 'Processando...' : `Assinar por ${fullPrice}${period === 'mensal' ? '/mês' : '/ano'}`}
            </Button>
          </Card>

          {/* Plano SINGLE */}
          <Card className="bg-card border-border rounded-xl p-6 space-y-6 flex flex-col">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-foreground">Plano 1 Concurso</h2>
              <p className="text-sm text-muted-foreground">Foco total em um único concurso</p>
            </div>
            <div>
              <span className="text-4xl font-bold text-foreground">{singlePrice}</span>
              <span className="text-sm text-muted-foreground ml-1">{singleSub}</span>
            </div>

            {/* Seletor de concurso */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Concurso</label>
              <Popover open={contestOpen} onOpenChange={setContestOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={contestOpen}
                    className="w-full justify-between font-normal text-left h-auto min-h-10 py-2"
                  >
                    <span className={`truncate ${selectedContest ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {selectedContest ? selectedContest.name : 'Selecione o concurso...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar concurso..." />
                    <CommandList>
                      <CommandEmpty>Nenhum concurso encontrado.</CommandEmpty>
                      <CommandGroup>
                        {contests.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setSelectedContestId(c.id === selectedContestId ? '' : c.id);
                              setContestOpen(false);
                            }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${selectedContestId === c.id ? 'opacity-100' : 'opacity-0'}`} />
                            <span className="text-sm">{c.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <ul className="space-y-3 flex-1">
              {SINGLE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span className="text-sm text-card-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout('single')}
              disabled={loading !== null || !selectedContestId}
              variant="outline"
              className="w-full border-emerald text-emerald hover:bg-emerald/10"
            >
              {loading === 'single' ? 'Processando...' : `Assinar por ${singlePrice}${period === 'mensal' ? '/mês' : '/ano'}`}
            </Button>
          </Card>
        </div>

        <div className="text-center space-y-1">
          {period === 'anual' && (
            <p className="text-xs text-muted-foreground">Planos anuais aceitam Cartão, Boleto e PIX</p>
          )}
          <p className="text-xs text-muted-foreground">Sem fidelidade — cancele quando quiser</p>
        </div>
      </div>
    </AppLayout>
  );
}
