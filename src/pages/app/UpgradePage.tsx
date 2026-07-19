import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, Smartphone, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useNativePlatform } from '@/hooks/useNativePlatform';

// Price IDs (Stripe live) — planos v2
const PRICES = {
  foco:       { mensal: 'price_1TuGRrGmx6vYOM030K39ju5f', semestral: 'price_1TuGRvGmx6vYOM03dIkOHyk9', anual: 'price_1TuGS1Gmx6vYOM03kKe4Bzf9' },
  multi:      { mensal: 'price_1TuGS6Gmx6vYOM03Ba3xI95Z', semestral: 'price_1TuGS9Gmx6vYOM03vgNHj7ii', anual: 'price_1TuGSBGmx6vYOM034Yu6fIvy' },
  passaporte: { mensal: 'price_1TuGSDGmx6vYOM03NiKUZrqj', semestral: 'price_1TuGSHGmx6vYOM0365EtuLAt', anual: 'price_1TuGSJGmx6vYOM03daLbePJR' },
} as const;

type Period = 'mensal' | 'semestral' | 'anual';
type PlanKey = 'foco' | 'multi' | 'passaporte';

interface Contest { id: string; name: string; slug: string; }

// Preços exibidos por plano × modalidade
const DISPLAY: Record<PlanKey, Record<Period, { price: string; sub: string }>> = {
  foco: {
    mensal:    { price: 'R$ 19,90', sub: 'no 1º mês · depois R$ 69,90/mês' },
    semestral: { price: 'R$ 335,52', sub: '6 meses à vista (−20%)' },
    anual:     { price: 'R$ 587,16', sub: '12 meses à vista (−30%)' },
  },
  multi: {
    mensal:    { price: 'R$ 129,90', sub: '/mês' },
    semestral: { price: 'R$ 623,52', sub: '6 meses à vista (−20%)' },
    anual:     { price: 'R$ 1.091,16', sub: '12 meses à vista (−30%)' },
  },
  passaporte: {
    mensal:    { price: 'R$ 199,90', sub: '/mês' },
    semestral: { price: 'R$ 959,52', sub: '6 meses à vista (−20%)' },
    anual:     { price: 'R$ 1.679,16', sub: '12 meses à vista (−30%)' },
  },
};

const PLAN_META: Record<PlanKey, { name: string; tagline: string; features: string[]; featured?: boolean }> = {
  foco: {
    name: 'Foco',
    tagline: '1 concurso por vez',
    features: [
      'Acesso a 1 concurso/edital à sua escolha',
      'Todos os agentes daquele concurso',
      'Estudo, questões e certo/errado',
      'Jurisprudência quando aplicável',
    ],
  },
  multi: {
    name: 'Multiconcurso',
    tagline: 'Até 5 concursos',
    featured: true,
    features: [
      'Escolha até 5 concursos no início do ciclo',
      'Navegue livremente entre eles',
      'Todos os agentes dos seus concursos',
      'Troca de concursos apenas na renovação',
    ],
  },
  passaporte: {
    name: 'Passaporte',
    tagline: 'Todos os concursos',
    features: [
      'Acesso a todos os concursos e cargos',
      'Todos os agentes da plataforma',
      'Suporte prioritário',
      'Navegação livre e ilimitada',
    ],
  },
};

// Textos exatos dos checkboxes (doc 6.2 / 6.3 / 6.4)
const CB_FOCO_PRICE =
  'Estou ciente de que o plano Foco custa R$ 19,90 no 1º mês e passa a R$ 69,90/mês a partir do 2º mês, cobrado automaticamente no mesmo cartão/meio de pagamento, salvo cancelamento prévio.';
const CB_RECURRING =
  'Autorizo a cobrança recorrente automática do valor do plano escolhido, na periodicidade selecionada (mensal, semestral ou anual), até que eu cancele a assinatura na área "Minha Assinatura".';
const CB_NO_REFUND =
  'Estou ciente de que, após o cancelamento, o plano semestral/anual não terá reembolso proporcional do valor pago — o acesso permanece ativo até o fim do ciclo já pago.';

function comoFunciona(plan: PlanKey, period: Period): string[] {
  if (plan === 'foco' && period === 'mensal') {
    return [
      '1º mês: R$ 19,90, com limite de 15 perguntas nos primeiros 7 dias.',
      'Do 8º ao 30º dia: mais 15 perguntas (até 30 no total no 1º mês).',
      'A partir do 2º mês: R$ 69,90/mês, cobrança automática no mesmo meio de pagamento.',
      'Cancele quando quiser, direto na plataforma, sem multa.',
    ];
  }
  const base = [
    `Cobrança ${period} recorrente de ${DISPLAY[plan][period].price}, renovada automaticamente até o cancelamento.`,
    'Cancele quando quiser, direto na plataforma, sem multa.',
  ];
  if (period !== 'mensal') {
    base.push('Pagamento à vista do período, com desconto. Sem reembolso proporcional em caso de cancelamento antecipado (acesso mantido até o fim do ciclo).');
  }
  return base;
}

export default function UpgradePage() {
  const navigate = useNavigate();
  const { isNative } = useNativePlatform();
  const [period, setPeriod] = useState<Period>('mensal');

  // Foco: seletor de concurso
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState('');
  const [contestOpen, setContestOpen] = useState(false);

  // Modal de confirmação
  const [confirmPlan, setConfirmPlan] = useState<PlanKey | null>(null);
  const [ckRecurring, setCkRecurring] = useState(false);
  const [ckFoco, setCkFoco] = useState(false);
  const [ckNoRefund, setCkNoRefund] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('contests').select('id, name, slug').eq('is_active', true)
      .order('display_order').order('name')
      .then(({ data }) => setContests((data as Contest[]) ?? []));
  }, []);

  const selectedContest = contests.find((c) => c.id === selectedContestId);

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
        </div>
      </AppLayout>
    );
  }

  const openConfirm = (plan: PlanKey) => {
    if (plan === 'foco' && !selectedContestId) {
      toast.error('Selecione o concurso do plano Foco.');
      return;
    }
    setCkRecurring(false);
    setCkFoco(false);
    setCkNoRefund(false);
    setConfirmPlan(plan);
  };

  const needFoco = confirmPlan === 'foco' && period === 'mensal';
  const needNoRefund = period !== 'mensal';
  const canConfirm = ckRecurring && (!needFoco || ckFoco) && (!needNoRefund || ckNoRefund);

  const handleCheckout = async () => {
    if (!confirmPlan || !canConfirm) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) { navigate('/auth/login'); return; }

      const successPath = period === 'anual' ? '/thank-you/annual' : '/thank-you/monthly';
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          price_id: PRICES[confirmPlan][period],
          ...(confirmPlan === 'foco' ? { contest_id: selectedContestId } : {}),
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
      setLoading(false);
    }
  };

  const planKeys: PlanKey[] = ['foco', 'multi', 'passaporte'];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-bold text-foreground">Escolha seu plano</h1>
          <p className="text-muted-foreground">Sem fidelidade — cancele quando quiser</p>
        </div>

        {/* Toggle modalidade */}
        <div className="flex justify-center">
          <div className="inline-flex gap-1 bg-muted p-1 rounded-lg">
            {(['mensal', 'semestral', 'anual'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${period === p ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              >
                {p}{p === 'semestral' ? ' −20%' : p === 'anual' ? ' −30%' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {planKeys.map((plan) => {
            const meta = PLAN_META[plan];
            const disp = DISPLAY[plan][period];
            return (
              <Card key={plan} className={`bg-card rounded-xl p-6 space-y-5 flex flex-col relative ${meta.featured ? 'border-emerald/50' : 'border-border'}`}>
                {meta.featured && (
                  <div className="absolute -top-3 left-6 bg-emerald text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Mais popular
                  </div>
                )}
                <div className="space-y-1">
                  <h2 className="font-display text-xl font-bold text-foreground">{meta.name}</h2>
                  <p className="text-sm text-muted-foreground">{meta.tagline}</p>
                </div>
                <div>
                  <span className="text-3xl font-bold text-emerald">{disp.price}</span>
                  <span className="text-xs text-muted-foreground ml-1">{disp.sub}</span>
                </div>

                {plan === 'foco' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Concurso</label>
                    <Popover open={contestOpen} onOpenChange={setContestOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between font-normal text-left h-auto min-h-10 py-2">
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
                                <CommandItem key={c.id} value={c.name} onSelect={() => {
                                  setSelectedContestId(c.id === selectedContestId ? '' : c.id);
                                  setContestOpen(false);
                                }}>
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
                )}

                <ul className="space-y-2.5 flex-1">
                  {meta.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                      <span className="text-sm text-card-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => openConfirm(plan)}
                  disabled={plan === 'foco' && !selectedContestId}
                  className={meta.featured
                    ? 'w-full bg-emerald hover:bg-emerald/90 text-primary-foreground'
                    : 'w-full border-emerald text-emerald hover:bg-emerald/10 bg-transparent border'}
                >
                  Assinar {meta.name}
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Uso da plataforma sujeito à{' '}
          <Link to="/politica-uso-justo" className="underline hover:text-foreground">Política de Uso Justo</Link>.
        </p>
      </div>

      {/* Modal de confirmação */}
      <Dialog open={confirmPlan !== null} onOpenChange={(o) => !o && setConfirmPlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Como funciona seu plano {confirmPlan ? PLAN_META[confirmPlan].name : ''}</DialogTitle>
          </DialogHeader>

          {confirmPlan && (
            <div className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {comoFunciona(confirmPlan, period).map((t, i) => (
                  <li key={i} className="flex gap-2"><span className="text-emerald">•</span><span>{t}</span></li>
                ))}
              </ul>

              <div className="space-y-3 border-t border-border pt-4">
                {needFoco && (
                  <label className="flex gap-2.5 text-xs text-card-foreground cursor-pointer">
                    <Checkbox checked={ckFoco} onCheckedChange={(v) => setCkFoco(v === true)} className="mt-0.5" />
                    <span>{CB_FOCO_PRICE}</span>
                  </label>
                )}
                <label className="flex gap-2.5 text-xs text-card-foreground cursor-pointer">
                  <Checkbox checked={ckRecurring} onCheckedChange={(v) => setCkRecurring(v === true)} className="mt-0.5" />
                  <span>{CB_RECURRING}</span>
                </label>
                {needNoRefund && (
                  <label className="flex gap-2.5 text-xs text-card-foreground cursor-pointer">
                    <Checkbox checked={ckNoRefund} onCheckedChange={(v) => setCkNoRefund(v === true)} className="mt-0.5" />
                    <span>{CB_NO_REFUND}</span>
                  </label>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground">
                Você tem 7 dias corridos para desistir com reembolso integral (art. 49, CDC). Uso sujeito à{' '}
                <Link to="/politica-uso-justo" className="underline">Política de Uso Justo</Link>.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setConfirmPlan(null)}>Cancelar</Button>
            <Button
              onClick={handleCheckout}
              disabled={!canConfirm || loading}
              className="bg-emerald hover:bg-emerald/90 text-primary-foreground"
            >
              {loading ? 'Processando...' : 'Ir para o pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
