import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LogoIcon } from '@/components/LogoIcon';
import { toast } from 'sonner';

// ─── Price IDs Stripe ────────────────────────────────────────────────────────
const PRICE_MONTHLY_600K = 'price_1TP8QLGmx6vYOM03CLWb2x9H'; // R$99/mês — 600k tokens
const PRICE_ANNUAL_600K  = 'price_1TP8QVGmx6vYOM03Fgvf6Urk'; // R$999/ano — 600k tokens
const PRICE_MONTHLY_1M   = 'price_1TP8QgGmx6vYOM03RiFKAp9B'; // R$129,90/mês — 1M tokens
const PRICE_ANNUAL_1M    = 'price_1TP8QqGmx6vYOM03ZwLhA6Ne'; // R$1.299/ano — 1M tokens
const PRICE_CREDITS = 'price_1SAwTuGmx6vYOM03G4nuqdbQ';

// ─── Dados dos agentes ───────────────────────────────────────────────────────
const AGENTES = [
  {
    n: 1, titulo: 'Análise Doutrinária Completa',
    sub: 'Sua biblioteca jurídica pessoal — IA alimentada com as melhores doutrinas',
    itens: [
      'Conceitos Doutrinários — Definições dos principais doutrinadores brasileiros',
      'Histórico Completo — Evolução do instituto no direito brasileiro',
      'Objetivo e Finalidade — Por que existe no ordenamento jurídico',
      'Características Principais — Todas as características fundamentais explicadas',
      'Classificações — Todas as classificações doutrinárias relevantes',
      'Tipos/Espécies — Enumera e detalha todos os tipos existentes',
      'Pessoas Envolvidas — Sujeitos jurídicos e seus direitos/deveres',
      'Efeitos Jurídicos — Consequências práticas do instituto',
      'Aspectos de Direito Material — Normas substantivas aplicáveis',
      'Aspectos de Direito Processual — Procedimentos e competências',
    ],
    pq: 'Substitui 10+ livros doutrinários (economia de R$2.000+). Linguagem técnica para concursos. Exemplos práticos para fixação.',
  },
  {
    n: 2, titulo: 'Legislação Comentada',
    sub: 'Artigos de lei explicados didaticamente para concursos',
    itens: [
      'Cole o artigo de lei e receba explicação completa e comentada',
      'Linguagem acessível sem perder o rigor técnico',
      'Identifica artigos revogados total ou parcialmente',
      'Fornece apenas legislação, provimentos e resoluções vigentes',
      'Contextualização do artigo no ordenamento jurídico',
      'Relação com súmulas e jurisprudência aplicável',
    ],
    pq: 'Transforma texto frio de lei em estudo estratégico. Seleciona apenas os artigos importantes sobre o assunto estudado.',
  },
  {
    n: 3, titulo: 'Informativos STF/STJ Atualizados',
    sub: 'Jurisprudência dos últimos anos na palma da sua mão',
    itens: [
      'Informativos dos Tribunais Superiores por tema solicitado',
      'Sempre atualizados — prioriza entendimentos mais recentes',
      'Casos práticos após cada informativo',
      'Formato estruturado para concursos',
      'Tese/Entendimento do tribunal',
      'Ementa resumida da decisão',
      'Caso prático para fixação e entendimento',
    ],
    pq: 'Jurisprudência é 30% da prova em muitos concursos. Conteúdo organizado e direcionado para o que as bancas cobram.',
  },
  {
    n: 4, titulo: 'Súmulas STF/STJ',
    sub: 'Todas as súmulas vigentes organizadas por tema',
    itens: [
      'Todas as súmulas não canceladas sobre qualquer tema',
      'Verificação automática de cancelamento',
      'Explicação didática do entendimento de cada súmula',
      'Caso prático para cada súmula',
      'Não informará súmulas canceladas ou superadas',
      'Organização por tema que está sendo objeto de estudo',
    ],
    pq: 'Súmulas caem muito em provas. Organização temática economiza horas de pesquisa.',
  },
  {
    n: 5, titulo: 'Súmulas Vinculantes do STF',
    sub: 'Todas as súmulas vinculantes por tema',
    itens: [
      'Base na Lei 11.417/06',
      'Verificação de cancelamento',
      'Casos práticos demonstrando aplicação',
      'Explica o efeito vinculante na prática',
      'Demonstra aplicação em órgãos públicos',
      'Fundamentação legal completa',
    ],
    pq: 'Súmulas vinculantes caem muito em concursos. Aplicação prática para melhor entendimento. Não informará súmulas canceladas.',
  },
  {
    n: 6, titulo: 'Súmulas e Orientações Jurisprudenciais do TST',
    sub: 'Direito do Trabalho e Processual do Trabalho dominados',
    itens: [
      'Súmulas do TST vigentes por tema solicitado',
      'Orientações Jurisprudenciais da SBDI-1, SBDI-2 e SDC',
      'OJs Transitórias do TST',
      'Não informará súmulas ou OJs canceladas',
      'Caso prático para cada enunciado',
      'Contexto e fundamentação legal de cada verbete',
      'Organização temática para estudo eficiente',
    ],
    pq: 'Direito do Trabalho exige domínio do TST. Cobertura completa de súmulas e OJs em um único agente.',
  },
  {
    n: 7, titulo: 'Informativos do TST',
    sub: 'Jurisprudência trabalhista atualizada para concursos',
    itens: [
      'Informativos do TST por tema solicitado',
      'Prioriza entendimentos mais recentes',
      'Tese firmada pelo tribunal em cada julgado',
      'Caso prático para fixação',
      'Formato estruturado para concursos',
      'Cobertura de decisões de 2021 a 2026',
    ],
    pq: 'Direito do Trabalho é matéria pesada em concursos da área. Informativos do TST são cobrados nas melhores bancas.',
  },
  {
    n: 8, titulo: 'Questões Objetivas de 5 Alternativas',
    sub: 'Questões de alta qualidade como as bancas fazem',
    itens: [
      'Questões de 5 alternativas por tema',
      'Nível concurso público real',
      'Fundamentação completa de todas as alternativas',
      'Base em doutrina, súmulas, informativos e legislação vigente',
      'Justificativa detalhada do erro de cada alternativa',
      'Justificativa detalhada do acerto da alternativa correta',
    ],
    pq: 'Qualidade de banca organizadora. Fundamentação que ensina mais que aulas.',
  },
  {
    n: 9, titulo: 'Questões de Certo ou Errado (CEBRASPE)',
    sub: 'Formato CESPE/CEBRASPE dominado',
    itens: [
      'Questões certo/errado por tema',
      'Estilo CESPE/CEBRASPE',
      'Justificativa da correta e da incorreta',
      'Base em fontes oficiais exclusivamente',
      'Nível técnico elevado, como nas bancas',
      'Estilo pegadinha típico das bancas',
    ],
    pq: 'Especialização em bancas CESPE/CEBRASPE. Fundamentação que ensina a lógica da banca.',
  },
  {
    n: 10, titulo: 'Português',
    sub: 'Gramática e interpretação no nível das bancas',
    itens: [
      'Gramática completa por tema solicitado',
      'Interpretação de texto com metodologia de banca',
      'Questões de fixação com gabarito comentado',
      'Regras gramaticais com exemplos práticos',
      'Pontuação, concordância, regência e colocação pronominal',
      'Linguagem formal exigida nas provas',
    ],
    pq: 'Português é eliminatório em quase todos os concursos. Dominar a gramática formal é essencial para aprovação.',
  },
  {
    n: 11, titulo: 'Informática',
    sub: 'Tecnologia da informação para concursos públicos',
    itens: [
      'Pacote Office (Word, Excel, PowerPoint, Outlook)',
      'Internet, navegadores e segurança da informação',
      'Sistemas operacionais (Windows e Linux)',
      'Hardware, software e redes de computadores',
      'Conceitos de banco de dados e TI',
      'Questões no estilo das bancas mais cobradas',
    ],
    pq: 'Informática básica é cobrada em praticamente todos os concursos públicos. Dominar o conteúdo garante pontos fáceis.',
  },
  {
    n: 12, titulo: 'Raciocínio Lógico Matemático',
    sub: 'Lógica e matemática com resolução passo a passo',
    itens: [
      'Lógica proposicional e sentenças lógicas',
      'Raciocínio sequencial e diagramas lógicos',
      'Matemática básica e financeira',
      'Probabilidade e estatística descritiva',
      'Resolução passo a passo de cada questão',
      'Questões no nível das principais bancas',
    ],
    pq: 'Raciocínio lógico diferencia candidatos em concursos de alta concorrência. Dominar a metodologia de resolução é o segredo.',
  },
  {
    n: 13, titulo: 'Contabilidade',
    sub: 'Contabilidade geral e pública para concursos',
    itens: [
      'Contabilidade geral com plano de contas',
      'Contabilidade pública e NBCASP',
      'Balanços patrimoniais e demonstrações financeiras',
      'Escrituração contábil e lançamentos',
      'Lei de Responsabilidade Fiscal aplicada',
      'Questões objetivas com gabarito comentado',
    ],
    pq: 'Contabilidade é exigida em concursos do TCU, TCE, Receita Federal e Câmara dos Deputados. Dominar o conteúdo é diferencial.',
  },
  {
    n: 14, titulo: 'Estatística',
    sub: 'Estatística e probabilidade com resolução detalhada',
    itens: [
      'Estatística descritiva completa',
      'Medidas de tendência central e dispersão',
      'Probabilidade e distribuições',
      'Amostragem e inferência estatística',
      'Resolução passo a passo de cada problema',
      'Questões no padrão das bancas organizadoras',
    ],
    pq: 'Estatística é cobrada em concursos de alto nível. Resolução passo a passo garante entendimento real do tema.',
  },
  {
    n: 15, titulo: 'Arquivologia',
    sub: 'Arquivística completa para concursos específicos',
    itens: [
      'Gestão de documentos e arquivos correntes',
      'Arquivos intermediários e permanentes',
      'Legislação arquivística (Lei 8.159/91 e Decretos)',
      'Classificação, avaliação e destinação de documentos',
      'Preservação e conservação de acervos',
      'Questões objetivas com gabarito comentado',
    ],
    pq: 'Arquivologia é matéria decisiva em concursos do STJ, TCU e Receita Federal. Dominar a legislação garante aprovação.',
  },
  {
    n: 16, titulo: 'Redação',
    sub: 'Correção e elaboração de redações para concursos',
    itens: [
      'Gera enunciado de redação no padrão das bancas',
      'Correção da sua redação com critérios de banca',
      'Padrão de resposta para comparação',
      'Avaliação por critérios: coesão, coerência, argumentação',
      'Comentários detalhados para evolução',
      'Adequação ao estilo formal exigido em concursos',
    ],
    pq: 'Redação é eliminatória em concursos de alto nível. Praticar com correção especializada acelera muito a evolução.',
  },
  {
    n: 17, titulo: 'Mentoria e Gestão do Tempo',
    sub: 'Seu cronograma personalizado para a aprovação',
    itemsLabel: 'Programar',
    itens: [
      'Horário de acordar em cada dia da semana',
      'Trabalho, deslocamento e compromissos fixos',
      'Academia, banho e alimentação no cronograma',
      'Tempo proporcional ao peso de cada matéria (número de questões)',
      'Distribuição inteligente ao longo da semana',
      'Máximo 2h seguidas com intervalos de 30 minutos',
      'Aproveitamento de 100% do tempo livre',
    ],
    pq: 'Coaching/mentoria custa caro (R$ 2.000,00+). Cronograma personalizado de acordo com a sua rotina.',
  },
];

// ─── Áreas atendidas ─────────────────────────────────────────────────────────
const AREAS = [
  'Magistratura', 'Ministério Público', 'Delegado de Polícia',
  'Cartórios', 'Procuradorias', 'Tribunais',
  'Defensoria Pública', 'Carreiras Policiais', 'OAB',
  'Auditoria Fiscal', 'Polícia Federal', 'Polícia Civil',
  'Receita Federal', 'TCU / TCE', 'Advocacia Pública',
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: 'A Inteligência Artificial realmente funciona para concursos públicos?',
    a: 'Sim — e pode ser o diferencial que faltava para a sua aprovação. O Sua Vaga IA foi desenvolvido exclusivamente para o universo dos concursos e cobre as principais disciplinas cobradas em prova, como Português, Informática, Raciocínio Lógico, Matemática, Estatística, Contabilidade, Arquivologia e Redação. Além disso, a plataforma é constantemente atualizada com legislação vigente, doutrinas relevantes, jurisprudência dos Tribunais Superiores e conteúdos alinhados ao perfil das principais bancas examinadoras. Na prática, você não recebe apenas respostas: recebe explicações completas, organizadas e estratégicas, já direcionadas para o que realmente tem mais chance de cair na prova. Isso elimina horas de pesquisa, evita dúvidas mal resolvidas e acelera o seu aprendizado com foco total em resultado. Com o Sua Vaga IA, você transforma estudo em estratégia — e estratégia em aprovação.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim — sem burocracia e sem compromisso. Você pode cancelar sua assinatura quando quiser, de forma simples e rápida, sem taxas ou multas. E o melhor: mesmo após o cancelamento, seu acesso continua normalmente até o final do período já pago. Assim, você tem total liberdade para testar a plataforma com tranquilidade e decidir se faz sentido para sua preparação.',
  },
  {
    q: 'Posso acessar a plataforma em qualquer dispositivo e estudar em diferentes formatos?',
    a: 'Sim — o Sua Vaga IA foi pensado para se adaptar totalmente à sua rotina. Você pode acessar a plataforma pelo celular, tablet ou computador, sem precisar instalar nada, e estudar de onde estiver, a qualquer momento. Além disso, você tem liberdade para escolher como aprender: pode ler as respostas diretamente na tela, imprimir para revisar no papel ou até ouvir o conteúdo em áudio — ideal para aproveitar momentos como deslocamentos, treinos ou tarefas do dia a dia. Na prática, isso significa mais flexibilidade, mais consistência nos estudos e a possibilidade de transformar qualquer momento em uma oportunidade de aprendizado.',
  },
  {
    q: 'Por que devo contratar o Sua Vaga IA, e não utilizar outras IAs?',
    a: 'O Sua Vaga IA não é uma IA genérica — é uma ferramenta criada exclusivamente para quem quer ser aprovado em concursos públicos. Enquanto IAs comuns entregam respostas amplas e muitas vezes superficiais, o Sua Vaga IA fornece conteúdos completos, aprofundados e direcionados exatamente para o que as bancas cobram. Cada resposta é construída com base em legislação atualizada, doutrinas relevantes e informativos dos Tribunais Superiores, garantindo mais segurança e precisão nos seus estudos. Além disso, você não perde tempo filtrando informações: o Sua Vaga IA já organiza tudo de forma clara, didática e estratégica, destacando os pontos mais importantes para prova. Na prática, isso significa estudar com mais eficiência, entender mais rápido e aumentar suas chances reais de aprovação.',
  },
  {
    q: 'Quantas perguntas posso fazer?',
    a: 'Você pode fazer centenas de perguntas por mês. Nosso sistema utiliza créditos inteligentes que priorizam respostas completas e aprofundadas, garantindo que você tenha qualidade de estudo, não apenas quantidade. Na prática, isso significa liberdade para estudar à vontade, tirar dúvidas e aprofundar conteúdos sem se preocupar a cada pergunta.',
  },
  {
    q: 'Posso imprimir as respostas ou ouvir em áudio?',
    a: 'Sim — você escolhe como quer estudar. Na plataforma, você pode tanto imprimir as respostas para revisar no papel quanto ouvir o conteúdo em áudio, facilitando o aprendizado em diferentes momentos do dia. Isso permite adaptar seus estudos à sua rotina: revisar com calma, fazer anotações ou até aprender enquanto dirige, treina ou realiza outras atividades. Mais flexibilidade, mais praticidade e mais eficiência na sua preparação.',
  },
];

// ─── Tokens de cor SVA ───────────────────────────────────────────────────────
const C = {
  navyDeep:     '#060E1F',
  navyCore:     '#0A1628',
  navyMid:      '#0F1F3D',
  navySoft:     '#132748',
  emerald:      '#10B981',
  emeraldLight: '#34D399',
  emeraldDark:  '#059669',
  slate:        '#64748B',
  slateLight:   '#94A3B8',
  slateLighter: '#CBD5E1',
  offWhite:     '#F8FAFC',
  border:       'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  borderEm:     'rgba(16,185,129,0.22)',
  red:          '#F87171',
  redBorder:    'rgba(239,68,68,0.15)',
};

const serif = "'DM Serif Display', Georgia, serif";
const sans  = "'DM Sans', system-ui, sans-serif";
const mono  = "'JetBrains Mono', ui-monospace, monospace";

// ─── Checkout helper ─────────────────────────────────────────────────────────
async function invokeCheckout(
  priceId: string,
  plan: string,
  navigate: ReturnType<typeof useNavigate>
) {
  const storageKey = 'sb-lxteajwzovoeclbytdrp-auth-token';
  const raw = localStorage.getItem(storageKey);
  const accessToken = raw ? JSON.parse(raw)?.access_token : null;

  if (!accessToken) {
    navigate('/auth/signup');
    return;
  }

  try {
    const isCredits = plan === 'credits';
    const isAnnual = plan.includes('annual');
    const successPath = isCredits ? '/thank-you/credits' : isAnnual ? '/thank-you/annual' : '/thank-you/monthly';
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        price_id: priceId,
        success_url: `${window.location.origin}${successPath}`,
        cancel_url: `${window.location.origin}/`,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  } catch {
    toast.error('Erro ao iniciar checkout. Tente novamente.');
  }
}

// ─── Primitivos ───────────────────────────────────────────────────────────────
function Tick({ size = 15, color = C.emerald }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M4 10l4.5 4.5L16 6" />
    </svg>
  );
}

interface AgentData {
  n: number;
  titulo: string;
  sub: string;
  itens: string[];
  pq: string;
  itemsLabel?: string;
}

function AgentRow({ ag }: { ag: AgentData }) {
  const [exp, setExp] = useState(false);
  const show = exp ? ag.itens : ag.itens.slice(0, 4);
  const more = ag.itens.length - 4;
  const label = ag.itemsLabel ?? 'O que inclui';

  return (
    <article className="lp-agent-row">
      <div>
        <div className="lp-agent-numeral">{String(ag.n).padStart(2, '0')}</div>
        <div className="lp-eyebrow-muted" style={{ fontSize: 10, marginTop: 8 }}>Agente</div>
      </div>

      <div>
        <h3 style={{ fontFamily: serif, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em',
          marginBottom: 14, color: C.offWhite, fontWeight: 400 }}>{ag.titulo}</h3>
        <p style={{ fontSize: 15, color: C.slateLight, lineHeight: 1.6, marginBottom: 24,
          maxWidth: 420, fontFamily: sans }}>{ag.sub}</p>
        <div style={{ background: 'rgba(16,185,129,0.05)', borderLeft: `2px solid ${C.emerald}`,
          padding: '12px 16px', maxWidth: 420 }}>
          <div className="lp-eyebrow" style={{ fontSize: 10, letterSpacing: '0.2em', marginBottom: 6 }}>
            Por que vale a pena
          </div>
          <p style={{ fontSize: 13, color: C.slateLighter, lineHeight: 1.6, fontFamily: sans }}>{ag.pq}</p>
        </div>
      </div>

      <div>
        <div className="lp-eyebrow-muted" style={{ fontSize: 10, marginBottom: 16 }}>
          {label} · {ag.itens.length} itens
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {show.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.emerald, marginTop: 4, minWidth: 20 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 14, color: C.slateLighter, lineHeight: 1.6, fontFamily: sans }}>{item}</span>
            </li>
          ))}
        </ul>
        {more > 0 && (
          <button onClick={() => setExp(!exp)}
            style={{ marginTop: 16, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: C.emerald, fontSize: 13, fontWeight: 500, fontFamily: sans,
              display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {exp ? '— Mostrar menos' : `+ Ver mais ${more} ${more === 1 ? 'item' : 'itens'}`}
          </button>
        )}
      </div>
    </article>
  );
}

interface FaqItemData {
  q: string;
  a: string;
}

function FaqItem({ item, idx }: { item: FaqItemData; idx: number }) {
  const [open, setOpen] = useState(idx === 0);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%',
        display: 'grid', gridTemplateColumns: '48px 1fr 32px', gap: 20, alignItems: 'center',
        padding: '28px 0', background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left' as const, color: 'inherit' }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: C.emerald, letterSpacing: '0.15em' }}>
          {String(idx + 1).padStart(2, '0')}
        </span>
        <span style={{ fontFamily: serif, fontSize: 22, letterSpacing: '-0.01em',
          lineHeight: 1.3, color: C.offWhite, fontWeight: 400 }}>
          {item.q}
        </span>
        <span style={{ width: 28, height: 28, borderRadius: '50%',
          border: `1px solid ${C.borderStrong}`, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', color: C.emerald,
          fontSize: 18, lineHeight: 1, transition: 'transform .2s',
          transform: open ? 'rotate(45deg)' : 'none', justifySelf: 'end' }}>+</span>
      </button>
      <div style={{ overflow: 'hidden', transition: 'max-height .3s, padding .3s',
        maxHeight: open ? 600 : 0, paddingBottom: open ? 28 : 0 }}>
        <div style={{ paddingLeft: 68, paddingRight: 60, maxWidth: 820 }}>
          <p style={{ fontSize: 16, color: C.slateLight, lineHeight: 1.7, fontFamily: sans }}>{item.a}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Landing Page Principal ───────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [planTab, setPlanTab] = useState<'mensal' | 'anual'>('mensal');
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const checkoutMonthly600k = () => invokeCheckout(PRICE_MONTHLY_600K, 'monthly_600k', navigate);
  const checkoutAnnual600k  = () => invokeCheckout(PRICE_ANNUAL_600K, 'annual_600k', navigate);
  const checkoutMonthly1m   = () => invokeCheckout(PRICE_MONTHLY_1M, 'monthly_1m', navigate);
  const checkoutAnnual1m    = () => invokeCheckout(PRICE_ANNUAL_1M, 'annual_1m', navigate);
  const checkoutCredits = () => invokeCheckout(PRICE_CREDITS, 'credits', navigate);

  return (
    <div style={{ background: C.navyDeep, minHeight: '100vh', fontFamily: sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none}
        .lp-wrap{max-width:1240px;margin:0 auto;padding:0 32px}
        .lp-wrap-sm{max-width:880px;margin:0 auto;padding:0 32px}
        .lp-wrap-md{max-width:920px;margin:0 auto;padding:0 32px}
        .lp-agents{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px}
        .lp-col2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .lp-areas{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
        .lp-gtext{background:linear-gradient(90deg,#10B981,#34D399);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .lp-sec{padding:96px 0}
        .lp-sec-border{border-top:1px solid ${C.border}}
        .lp-card-hover{transition:border-color 0.2s,background 0.2s}
        .lp-agent-head{display:grid;grid-template-columns:100px 1fr;gap:48px;margin-bottom:40px}
        .lp-agent-row{display:grid;grid-template-columns:100px 1fr 1fr;gap:48px;padding:48px 0;border-top:1px solid ${C.border};align-items:start}
        .lp-agent-numeral{font-family:${serif};font-size:64px;line-height:1;color:${C.emerald};letter-spacing:-.02em}
        .lp-ledger{display:grid;grid-template-columns:1fr 1fr;border:1px solid ${C.border}}
        .lp-ledger-col{padding:36px 36px 28px}
        .lp-diff-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:80px;align-items:start}
        .lp-areas-grid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid ${C.border}}
        .lp-area-cell{padding:28px;display:flex;align-items:center;gap:16px;transition:background .2s}
        .lp-area-cell:hover{background:rgba(16,185,129,0.04)}
        .lp-plans{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid ${C.border}}
        .lp-plan-col{padding:40px 32px 36px;display:flex;flex-direction:column;gap:24px;position:relative}
        .lp-plan-badge{position:absolute;top:0;left:0;right:0;height:28px;font-family:${mono};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;display:flex;align-items:center;justify-content:center}
        .lp-plan-badge-on{background:${C.emerald};color:#fff}
        .lp-plan-badge-off{background:transparent;color:${C.emerald};border-bottom:1px solid ${C.borderEm}}
        .lp-faq-grid{display:grid;grid-template-columns:1fr 2fr;gap:64px;margin-bottom:48px}
        .lp-nav{display:flex;align-items:center;gap:28px}
        .lp-nav-link{font-family:${mono};font-size:12px;color:${C.slateLight};letter-spacing:0.08em;text-transform:uppercase;transition:color .18s}
        .lp-nav-link:hover{color:${C.emerald}}
        .lp-nav-login{color:${C.slateLight};font-size:14px;font-family:${sans};transition:color .18s}
        .lp-nav-login:hover{color:${C.offWhite}}
        .lp-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px}
        .lp-tab{padding:8px 20px;border-radius:4px;font-family:${mono};font-size:12px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;border:1px solid ${C.borderStrong};background:transparent;color:${C.slateLight};transition:all .18s}
        .lp-tab.active{background:${C.emerald};color:#fff;border-color:${C.emerald}}
        @media(max-width:900px){
          .lp-agent-head{grid-template-columns:1fr;gap:16px}
          .lp-agent-row{grid-template-columns:1fr;gap:24px;padding:36px 0}
          .lp-agent-numeral{font-size:48px}
          .lp-ledger{grid-template-columns:1fr}
          .lp-ledger-col{border-right:none!important;border-bottom:1px solid ${C.border}}
          .lp-diff-grid{grid-template-columns:1fr;gap:32px}
          .lp-areas-grid{grid-template-columns:repeat(2,1fr)}
          .lp-area-cell{border-right:none!important}
          .lp-area-cell:nth-child(odd){border-right:1px solid ${C.border}!important}
        }
        @media(max-width:900px){
          .lp-plans{grid-template-columns:1fr}
          .lp-plan-col{border-right:none!important;border-bottom:1px solid ${C.border}}
          .lp-plan-col:last-child{border-bottom:none}
          .lp-faq-grid{grid-template-columns:1fr;gap:32px}
          .lp-nav{gap:16px;flex-wrap:wrap;justify-content:flex-end}
          .lp-footer-grid{grid-template-columns:1fr 1fr;gap:32px}
        }
        @media(max-width:720px){
          .lp-nav-link{display:none}
          .lp-nav-login{display:none}
          .lp-footer-grid{grid-template-columns:1fr;gap:28px}
        }
        @media(max-width:540px){
          .lp-areas-grid{grid-template-columns:1fr}
          .lp-area-cell:nth-child(odd){border-right:none!important}
        }
        .lp-hero-grid{display:grid;grid-template-columns:auto 1fr;gap:40px;align-items:start}
        .lp-hero-numeral{font-family:${serif};font-size:clamp(60px,9vw,140px);line-height:.95;letter-spacing:-.04em;color:${C.slate};opacity:.22}
        .lp-hero-h1{font-family:${serif};font-size:clamp(48px,7vw,96px);line-height:1.02;letter-spacing:-.03em;color:${C.offWhite};margin-bottom:32px}
        .lp-hero-h1 em{font-style:italic;color:${C.emeraldLight}}
        .lp-hero-trust{margin-top:80px;padding-top:32px;border-top:1px solid ${C.border};display:grid;grid-template-columns:repeat(4,1fr);gap:32px}
        .lp-eyebrow{font-family:${mono};font-size:11px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:${C.emerald}}
        .lp-eyebrow-muted{font-family:${mono};font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:${C.slate}}
        .lp-cta-primary{display:inline-flex;align-items:center;gap:10px;background:${C.emerald};color:#fff;border:none;border-radius:4px;font-family:${sans};font-weight:600;font-size:14px;letter-spacing:.01em;padding:14px 24px;cursor:pointer;transition:background .18s}
        .lp-cta-primary:hover{background:${C.emeraldDark}}
        .lp-cta-primary .lp-arrow{transition:transform .18s;display:inline-block}
        .lp-cta-primary:hover .lp-arrow{transform:translateX(3px)}
        .lp-cta-ghost{display:inline-flex;align-items:center;gap:10px;background:transparent;color:${C.offWhite};border:1px solid ${C.borderStrong};border-radius:4px;font-family:${sans};font-weight:500;font-size:14px;padding:14px 24px;cursor:pointer;transition:all .18s;text-decoration:none}
        .lp-cta-ghost:hover{border-color:${C.emerald};color:${C.emerald}}
        @media(max-width:900px){
          .lp-wrap,.lp-wrap-sm,.lp-wrap-md{padding:0 20px}
          .lp-sec{padding:72px 0}
          .lp-hero-grid{grid-template-columns:1fr;gap:20px}
          .lp-hero-numeral{font-size:80px}
          .lp-hero-trust{grid-template-columns:1fr 1fr;gap:20px}
        }
        @media(max-width:768px){
          .lp-agents{grid-template-columns:1fr}
          .lp-col2{grid-template-columns:1fr}
          .lp-areas{grid-template-columns:repeat(2,1fr)}
          .lp-hide{display:none!important}
          .lp-hero-trust{grid-template-columns:1fr}
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'rgba(6,14,31,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all .25s',
      }}>
        <div className="lp-wrap" style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '18px 32px', gap: 16 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LogoIcon size={30} />
            <span style={{ fontFamily: serif, fontSize: 20, letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', color: C.offWhite }}>
              Sua Vaga <span style={{ color: C.emerald }}>IA</span>
            </span>
          </Link>
          <nav className="lp-nav">
            <a href="#agentes" className="lp-nav-link">Agentes</a>
            <a href="#areas" className="lp-nav-link">Áreas</a>
            <a href="#planos" className="lp-nav-link">Planos</a>
            <a href="#faq" className="lp-nav-link">FAQ</a>
            <Link to="/auth/login" className="lp-nav-login">Entrar</Link>
            <button onClick={() => setShowPlanModal(true)} className="lp-cta-primary" style={{ padding: '10px 18px', fontSize: 13 }}>
              Assinar
            </button>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', padding: '80px 0 120px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-15%', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(59,130,246,0.04) 0%,transparent 60%)', pointerEvents: 'none' }} />

        <div className="lp-wrap" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 80, flexWrap: 'wrap', gap: 16 }}>
            <div className="lp-eyebrow-muted">
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: C.emerald, marginRight: 10, verticalAlign: 'middle' }} />
              Edição 2026 / Vol.01
            </div>
            <div className="lp-eyebrow-muted">Concursos Públicos — Jurídicos</div>
          </div>

          <div className="lp-hero-grid">
            <div className="lp-hero-numeral">01</div>
            <div>
              <h1 className="lp-hero-h1">
                Transforme sua preparação<br />
                <em>para concursos</em>
              </h1>
              <div style={{ maxWidth: 620 }}>
                <p style={{ fontSize: 20, lineHeight: 1.55, color: C.slateLighter, marginBottom: 16, fontFamily: sans }}>
                  Inteligência Artificial enriquecida com as melhores doutrinas e jurisprudências atualizadas.
                </p>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: C.slate, marginBottom: 40, fontFamily: sans }}>
                  Enquanto outros candidatos estudam de forma desorganizada e superficial, você terá acesso
                  à primeira plataforma brasileira de preparação completa, estruturada e personalizada para
                  concursos públicos de alto nível.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
                  <button onClick={() => setShowPlanModal(true)} className="lp-cta-primary">
                    Assinar Agora — R$ 99/mês
                    <span className="lp-arrow">→</span>
                  </button>
                  <Link to="/auth/signup" className="lp-cta-ghost">Começar Grátis</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-hero-trust">
            {[
              ['Dispositivo', 'Acesso por celular, tablet ou computador'],
              ['Áudio', 'Ouça as respostas em qualquer lugar'],
              ['Imprimir', 'Imprima as respostas para revisar no papel'],
              ['Flexibilidade', 'Cancele a qualquer momento, sem multa'],
            ].map(([k, v], i) => (
              <div key={i}>
                <div className="lp-eyebrow" style={{ fontSize: 10, letterSpacing: '0.2em', marginBottom: 8 }}>{k}</div>
                <div style={{ fontSize: 14, color: C.slateLighter, lineHeight: 1.5, fontFamily: sans }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENTES ── */}
      <section id="agentes" className="lp-sec lp-sec-border" style={{ background: C.navyDeep }}>
        <div className="lp-wrap">
          <div className="lp-agent-head">
            <div className="lp-eyebrow" style={{ paddingTop: 8 }}>§02</div>
            <div style={{ maxWidth: 720 }}>
              <div className="lp-eyebrow" style={{ marginBottom: 16 }}>
                O que você recebe
              </div>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(40px,5.5vw,68px)', lineHeight: 1.05,
                letterSpacing: '-0.025em', marginBottom: 20, color: C.offWhite, fontWeight: 400 }}>
                Agentes especializados<br />
                em <em style={{ fontStyle: 'italic', color: C.emeraldLight }}>concursos públicos</em>
              </h2>
              <p style={{ fontSize: 17, color: C.slateLight, lineHeight: 1.6, maxWidth: 560, fontFamily: sans }}>
                Cada um desenvolvido especificamente para uma área dos seus estudos.
              </p>
            </div>
          </div>
          <div>
            {AGENTES.map((ag) => <AgentRow key={ag.n} ag={ag} />)}
          </div>
        </div>
      </section>

      {/* ── CUSTO-BENEFÍCIO ── */}
      <section className="lp-sec lp-sec-border" style={{ background: C.navyCore }}>
        <div className="lp-wrap-sm">
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="lp-eyebrow" style={{ marginBottom: 16 }}>§03 — Análise de Custo-Benefício</div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(40px,5.5vw,68px)', lineHeight: 1.05,
              letterSpacing: '-0.025em', color: C.offWhite, fontWeight: 400 }}>
              Quanto você <em style={{ fontStyle: 'italic', color: C.emeraldLight }}>economiza</em> todo mês
            </h2>
          </div>

          <div className="lp-ledger">
            <div className="lp-ledger-col" style={{ borderRight: `1px solid ${C.border}` }}>
              <div className="lp-eyebrow" style={{ color: C.red, marginBottom: 28 }}>Sem o Sua Vaga IA</div>
              {[['Livros de doutrina', 'R$ 2.000+'], ['Coaching / mentoria', 'R$ 2.000+'],
                ['Simulados', 'R$ 500+'], ['Informativos', 'R$ 400+']].map(([item, val], k) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '16px 0', borderTop: k === 0 ? 'none' : `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 14, color: C.slateLight, fontFamily: sans }}>{item}</span>
                  <span style={{ fontFamily: mono, fontSize: 14, color: C.red, fontWeight: 500 }}>{val}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginTop: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="lp-eyebrow-muted">Total / mês</span>
                <span style={{ fontFamily: serif, fontSize: 40, color: C.red, letterSpacing: '-0.02em' }}>
                  R$ 4.900+
                </span>
              </div>
            </div>

            <div className="lp-ledger-col" style={{ background: 'rgba(16,185,129,0.04)' }}>
              <div className="lp-eyebrow" style={{ marginBottom: 28 }}>Com o Sua Vaga IA</div>
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: serif, fontSize: 80, lineHeight: 0.9,
                    letterSpacing: '-0.04em', color: C.offWhite, marginBottom: 4 }}>R$ 99</div>
                  <div className="lp-eyebrow">por mês — 600k tokens</div>
                  <div style={{ fontSize: 13, color: C.slate, marginTop: 8, fontFamily: sans }}>
                    ou R$ 999/ano (≈ R$ 83,25/mês)
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${C.borderEm}`, borderBottom: `1px solid ${C.borderEm}`,
                  padding: '16px 0', margin: '16px 0' }}>
                  <div style={{ fontFamily: serif, fontSize: 80, lineHeight: 0.9,
                    letterSpacing: '-0.04em', color: C.emeraldLight, marginBottom: 4 }}>R$ 129</div>
                  <div className="lp-eyebrow" style={{ color: C.emeraldLight }}>por mês — 1M tokens</div>
                  <div style={{ fontSize: 13, color: C.slate, marginTop: 8, fontFamily: sans }}>
                    ou R$ 1.299/ano (≈ R$ 108,25/mês)
                  </div>
                </div>
              </div>
              <div style={{ paddingTop: 12, textAlign: 'center' }}>
                <div style={{ fontFamily: serif, fontSize: 22, color: C.emeraldLight,
                  letterSpacing: '-0.01em', fontStyle: 'italic' }}>
                  Economia de R$ 4.700,00+ por mês
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <button onClick={checkoutMonthly600k} className="lp-cta-primary">
              Assinar Agora — R$ 99/mês <span className="lp-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAL ── */}
      <section className="lp-sec lp-sec-border" style={{ background: C.navyDeep }}>
        <div className="lp-wrap">
          <div className="lp-diff-grid">
            <div>
              <div className="lp-eyebrow" style={{ marginBottom: 16 }}>§04 — Nosso Diferencial</div>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(40px,5vw,64px)', lineHeight: 1.05,
                letterSpacing: '-0.025em', marginBottom: 24, color: C.offWhite, fontWeight: 400 }}>
                Por que o Sua Vaga IA é <em style={{ fontStyle: 'italic', color: C.emeraldLight }}>diferente</em> de tudo
              </h2>
              <p style={{ fontSize: 16, color: C.slateLight, lineHeight: 1.7, fontFamily: sans }}>
                Primeira plataforma de IA especializada em concursos públicos
              </p>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Inteligência artificial enriquecida com as melhores doutrinas',
                'IA que prioriza e seleciona os últimos entendimentos jurisprudenciais',
                'Casos práticos que facilitam o entendimento de cada tema',
                'Estudo organizado, completo e personalizado para o seu edital',
              ].map((item, i, arr) => (
                <li key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 24,
                  padding: '28px 0', borderTop: `1px solid ${C.border}`,
                  ...(i === arr.length - 1 ? { borderBottom: `1px solid ${C.border}` } : {}) }}>
                  <div style={{ fontFamily: serif, fontSize: 28, color: C.emerald,
                    lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p style={{ fontSize: 19, color: C.offWhite, lineHeight: 1.45,
                    letterSpacing: '-0.005em', fontFamily: sans }}>{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── ÁREAS ATENDIDAS ── */}
      <section id="areas" className="lp-sec lp-sec-border" style={{ background: C.navyCore }}>
        <div className="lp-wrap">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="lp-eyebrow" style={{ marginBottom: 16 }}>§05 — Expansão Constante</div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(40px,5.5vw,68px)', lineHeight: 1.05,
              letterSpacing: '-0.025em', marginBottom: 16, color: C.offWhite, fontWeight: 400 }}>
              Áreas <em style={{ fontStyle: 'italic', color: C.emeraldLight }}>atendidas</em>
            </h2>
            <p style={{ fontSize: 16, color: C.slateLight, fontFamily: sans }}>Disponíveis agora</p>
          </div>

          <div className="lp-areas-grid">
            {AREAS.map((area, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const lastRow = Math.floor((AREAS.length - 1) / 3);
              return (
                <div key={i} className="lp-area-cell" style={{
                  borderRight: col < 2 ? `1px solid ${C.border}` : 'none',
                  borderBottom: row < lastRow ? `1px solid ${C.border}` : 'none',
                }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.emerald,
                    letterSpacing: '0.1em', minWidth: 28 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 15, color: C.offWhite,
                    letterSpacing: '-0.005em', fontFamily: sans }}>{area}</span>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <button onClick={checkoutMonthly600k} className="lp-cta-primary">
              Assinar Agora <span className="lp-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── O QUE VOCÊ GANHA ── */}
      <section className="lp-sec lp-sec-border" style={{ background: C.navyDeep }}>
        <div className="lp-wrap-sm">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="lp-eyebrow" style={{ marginBottom: 16 }}>§06 — Acesso imediato</div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(40px,5.5vw,68px)', lineHeight: 1.05,
              letterSpacing: '-0.025em', color: C.offWhite, fontWeight: 400 }}>
              O que você <em style={{ fontStyle: 'italic', color: C.emeraldLight }}>ganha hoje</em>
            </h2>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: `1px solid ${C.border}` }}>
            {AGENTES.map((ag, i) => (
              <li key={i} style={{ display: 'grid', gridTemplateColumns: '50px 24px 1fr',
                gap: 16, alignItems: 'center', padding: '18px 0',
                borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.slate, letterSpacing: '0.1em' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Tick size={14} />
                <span style={{ fontSize: 16, color: C.offWhite,
                  letterSpacing: '-0.005em', fontFamily: sans }}>{ag.titulo}</span>
              </li>
            ))}
            <li style={{ display: 'grid', gridTemplateColumns: '50px 24px 1fr',
              gap: 16, alignItems: 'center', padding: '18px 0',
              borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.slate, letterSpacing: '0.1em' }}>
                {String(AGENTES.length + 1).padStart(2, '0')}
              </span>
              <Tick size={14} />
              <span style={{ fontSize: 16, color: C.offWhite, letterSpacing: '-0.005em', fontFamily: sans }}>
                Respostas que podem ser impressas ou ouvidas em áudio
              </span>
            </li>
            <li style={{ display: 'grid', gridTemplateColumns: '50px 24px 1fr',
              gap: 16, alignItems: 'center', padding: '18px 0',
              borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.slate, letterSpacing: '0.1em' }}>
                {String(AGENTES.length + 2).padStart(2, '0')}
              </span>
              <Tick size={14} />
              <span style={{ fontSize: 16, color: C.offWhite, letterSpacing: '-0.005em', fontFamily: sans }}>
                Atualizações constantes da base jurídica
              </span>
            </li>
          </ul>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <button onClick={checkoutMonthly600k} className="lp-cta-primary">
              Assinar Agora <span className="lp-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── ECONOMIA DE TEMPO ── */}
      <section className="lp-sec lp-sec-border" style={{ background: C.navyCore }}>
        <div className="lp-wrap">
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="lp-eyebrow" style={{ marginBottom: 16 }}>§07 — Eficiência</div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(40px,5.5vw,68px)', lineHeight: 1.05,
              letterSpacing: '-0.025em', color: C.offWhite, fontWeight: 400 }}>
              Quanto <em style={{ fontStyle: 'italic', color: C.emeraldLight }}>tempo</em> você vai economizar
            </h2>
          </div>

          <div className="lp-ledger">
            <div className="lp-ledger-col" style={{ borderRight: `1px solid ${C.border}`, padding: 40 }}>
              <div className="lp-eyebrow" style={{ color: C.red, marginBottom: 28 }}>Antes / Sem o SVA</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Pesquisar legislação manualmente', 'Encontrar súmulas por conta própria',
                  'Buscar informativos dispersos', 'Pesquisar questões em vários sites',
                  'Organizar cronograma ou pagar mentoria'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 16, padding: '14px 0',
                    borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
                    <span style={{ color: C.red, fontSize: 18, lineHeight: 1 }}>—</span>
                    <span style={{ fontSize: 15, color: C.slateLight, lineHeight: 1.5, fontFamily: sans }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-ledger-col" style={{ background: 'rgba(16,185,129,0.04)', padding: 40 }}>
              <div className="lp-eyebrow" style={{ marginBottom: 28 }}>Depois / Com o SVA</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Todo o conteúdo pronto e organizado', 'Economia de tempo e dinheiro',
                  'Legislação sempre atualizada', 'Melhores doutrinas sobre o tema',
                  'Informativos de jurisprudência atualizados', 'Questões de concursos para fixação',
                  'Casos práticos para entendimento', 'Mentoria e gestão do tempo'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 16, padding: '14px 0',
                    borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
                    <Tick size={14} />
                    <span style={{ fontSize: 15, color: C.offWhite, lineHeight: 1.5, fontFamily: sans }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="lp-sec lp-sec-border" style={{ background: C.navyDeep }}>
        <div className="lp-wrap">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="lp-eyebrow" style={{ marginBottom: 16 }}>§08 — Comece hoje mesmo</div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(40px,5.5vw,68px)', lineHeight: 1.05,
              letterSpacing: '-0.025em', marginBottom: 16, color: C.offWhite, fontWeight: 400 }}>
              Escolha <em style={{ fontStyle: 'italic', color: C.emeraldLight }}>seu plano</em>
            </h2>
            <p style={{ fontSize: 16, color: C.slateLight, fontFamily: sans, marginBottom: 32 }}>
              Sem multa, sem fidelidade — cancele quando quiser.
            </p>
            {/* Tab mensal / anual */}
            <div style={{ display: 'inline-flex', gap: 8, background: 'rgba(255,255,255,0.04)',
              padding: 4, borderRadius: 6, border: `1px solid ${C.border}` }}>
              <button className={`lp-tab${planTab === 'mensal' ? ' active' : ''}`}
                onClick={() => setPlanTab('mensal')}>Mensal</button>
              <button className={`lp-tab${planTab === 'anual' ? ' active' : ''}`}
                onClick={() => setPlanTab('anual')}>
                Anual — economize até 31%
              </button>
            </div>
          </div>

          <div className="lp-plans">
            {/* Grátis */}
            <div className="lp-plan-col" style={{ borderRight: `1px solid ${C.border}` }}>
              <div>
                <div className="lp-eyebrow-muted" style={{ marginBottom: 20 }}>Grátis</div>
                <div style={{ fontFamily: serif, fontSize: 56, letterSpacing: '-0.03em',
                  lineHeight: 1, color: C.offWhite }}>R$ 0</div>
                <div style={{ fontSize: 13, color: C.slate, marginTop: 8, fontFamily: sans }}>para sempre</div>
              </div>
              <div style={{ height: 1, background: C.border }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex',
                flexDirection: 'column', gap: 12, flex: 1 }}>
                {['Acesso limitado aos agentes', '5 gerações de cronograma de mentoria',
                  'Explorar a plataforma sem compromisso'].map((f, j) => (
                  <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 2 }}><Tick size={13} color={C.slate} /></div>
                    <span style={{ fontSize: 13.5, color: C.slateLight, lineHeight: 1.55, fontFamily: sans }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/signup" className="lp-cta-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                Começar Grátis
              </Link>
            </div>

            {/* 600k tokens */}
            <div className="lp-plan-col" style={{ borderRight: `1px solid ${C.border}`, background: 'rgba(16,185,129,0.03)' }}>
              <div className="lp-plan-badge lp-plan-badge-off">Plano Essencial</div>
              <div style={{ marginTop: 20 }}>
                <div className="lp-eyebrow-muted" style={{ marginBottom: 20 }}>600.000 tokens / mês</div>
                <div style={{ fontFamily: serif, fontSize: 56, letterSpacing: '-0.03em',
                  lineHeight: 1, color: C.offWhite }}>
                  {planTab === 'mensal' ? 'R$ 99' : 'R$ 999'}
                </div>
                <div style={{ fontSize: 13, color: C.slate, marginTop: 8, fontFamily: sans }}>
                  {planTab === 'mensal' ? '/mês' : '/ano — ≈ R$ 83,25/mês'}
                </div>
              </div>
              <div style={{ height: 1, background: C.border }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex',
                flexDirection: 'column', gap: 12, flex: 1 }}>
                {['600.000 tokens por mês', 'Todos os agentes especializados',
                  'Informativos STF/STJ/TST atualizados', 'Súmulas e OJs com casos práticos',
                  'Mentoria e cronograma personalizados', 'Questões objetivas e certo/errado',
                  'Cancele a qualquer momento',
                  ...(planTab === 'anual' ? ['PIX e Boleto disponíveis', 'Parcelamento em até 12x no cartão'] : [])
                ].map((f, j) => (
                  <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 2 }}><Tick size={13} color={C.slateLight} /></div>
                    <span style={{ fontSize: 13.5, color: C.slateLighter, lineHeight: 1.55, fontFamily: sans }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={planTab === 'mensal' ? checkoutMonthly600k : checkoutAnnual600k}
                className="lp-cta-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                {planTab === 'mensal' ? 'Assinar por R$ 99/mês' : 'Assinar por R$ 999/ano'} <span className="lp-arrow">→</span>
              </button>
            </div>

            {/* 1M tokens (featured) */}
            <div className="lp-plan-col" style={{ background: 'rgba(16,185,129,0.05)' }}>
              <div className="lp-plan-badge lp-plan-badge-on">Mais Popular</div>
              <div style={{ marginTop: 20 }}>
                <div className="lp-eyebrow" style={{ marginBottom: 20 }}>1.000.000 tokens / mês</div>
                <div style={{ fontFamily: serif, fontSize: 56, letterSpacing: '-0.03em',
                  lineHeight: 1, color: C.emeraldLight }}>
                  {planTab === 'mensal' ? 'R$ 129' : 'R$ 1.299'}
                </div>
                <div style={{ fontSize: 13, color: C.slate, marginTop: 8, fontFamily: sans }}>
                  {planTab === 'mensal' ? '/mês' : '/ano — ≈ R$ 108,25/mês'}
                </div>
              </div>
              <div style={{ height: 1, background: C.border }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex',
                flexDirection: 'column', gap: 12, flex: 1 }}>
                {['1.000.000 tokens por mês', 'Todos os benefícios do plano Essencial',
                  'Mais interações para estudar sem limites', 'Respostas mais longas e detalhadas',
                  'Cancele a qualquer momento',
                  ...(planTab === 'anual' ? ['PIX e Boleto disponíveis', 'Parcelamento em até 12x no cartão'] : [])
                ].map((f, j) => (
                  <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 2 }}><Tick size={13} color={C.emeraldLight} /></div>
                    <span style={{ fontSize: 13.5, color: C.slateLighter, lineHeight: 1.55, fontFamily: sans }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={planTab === 'mensal' ? checkoutMonthly1m : checkoutAnnual1m}
                className="lp-cta-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {planTab === 'mensal' ? 'Assinar por R$ 129/mês' : 'Assinar por R$ 1.299/ano'} <span className="lp-arrow">→</span>
              </button>
            </div>
          </div>

          {/* Créditos avulsos */}
          <div style={{ marginTop: 40, border: `1px solid ${C.border}`, padding: '28px 36px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="lp-eyebrow">Add-on / Créditos</div>
              <div>
                <div style={{ fontSize: 15, color: C.offWhite, fontWeight: 500,
                  marginBottom: 2, fontFamily: sans }}>
                  Pacote de Créditos Avulsos
                </div>
                <div style={{ fontSize: 13, color: C.slate, fontFamily: sans }}>
                  600.000 tokens adicionais por R$ 49,90
                </div>
              </div>
            </div>
            <button onClick={checkoutCredits} className="lp-cta-ghost" style={{ padding: '10px 20px', fontSize: 13 }}>
              Comprar Créditos
            </button>
          </div>

          {/* Formas de pagamento */}
          <div style={{ marginTop: 32, border: `1px solid ${C.border}`, padding: '20px 28px',
            background: 'rgba(255,255,255,0.02)' }}>
            <div className="lp-eyebrow-muted" style={{ marginBottom: 16, fontSize: 10 }}>Formas de pagamento aceitas</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {[
                { label: 'Cartão de crédito', obs: 'todos os planos' },
                { label: 'Apple Pay', obs: 'todos os planos' },
                { label: 'Link (Stripe)', obs: 'todos os planos' },
                { label: 'PIX', obs: 'apenas planos anuais' },
                { label: 'Boleto Bancário', obs: 'apenas planos anuais' },
                { label: 'Parcelamento 12x', obs: 'planos anuais com juros do cartão' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.slateLighter,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tick size={11} color={C.emerald} />
                    {p.label}
                  </span>
                  <span style={{ fontFamily: sans, fontSize: 11, color: C.slate, paddingLeft: 17 }}>{p.obs}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NÃO PERCA TEMPO ── */}
      <section className="lp-sec lp-sec-border" style={{ background: C.navyCore, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 600,
          background: 'radial-gradient(ellipse at center,rgba(16,185,129,0.06) 0%,transparent 60%)',
          pointerEvents: 'none' }} />
        <div className="lp-wrap-sm" style={{ position: 'relative', textAlign: 'center' }}>
          <div className="lp-eyebrow" style={{ marginBottom: 24 }}>§09</div>
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(52px,7vw,96px)', lineHeight: 1,
            letterSpacing: '-0.03em', marginBottom: 32, color: C.offWhite, fontWeight: 400 }}>
            Não perca <em style={{ fontStyle: 'italic', color: C.emeraldLight }}>tempo</em>
          </h2>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: C.slateLighter, maxWidth: 620,
            margin: '0 auto 32px', fontFamily: sans }}>
            Enquanto você está lendo isso, centenas de candidatos já estão usando a
            inteligência artificial para estudar de forma mais eficiente.
          </p>
          <p style={{ fontSize: 17, color: C.offWhite, marginBottom: 12, fontFamily: sans }}>
            A pergunta não é <em style={{ fontStyle: 'italic' }}>se</em> você vai precisar dominar IA nos estudos.
          </p>
          <p style={{ fontFamily: serif, fontSize: 28, color: C.emeraldLight,
            letterSpacing: '-0.015em', fontStyle: 'italic', marginBottom: 56, lineHeight: 1.3 }}>
            A pergunta é: você vai estar na frente<br />ou atrás dos outros candidatos?
          </p>

          <div style={{ display: 'inline-block', border: `1px solid ${C.borderEm}`,
            padding: '32px 48px', marginBottom: 40,
            background: 'rgba(6,14,31,0.5)', backdropFilter: 'blur(8px)' }}>
            <div className="lp-eyebrow-muted" style={{ marginBottom: 8 }}>Ação imediata</div>
            <p style={{ color: C.slateLighter, fontFamily: sans, fontSize: 14,
              lineHeight: 1.65, marginBottom: 6 }}>
              Garanta sua vaga entre os primeiros 1000 usuários com desconto.
            </p>
            <p style={{ color: C.slate, fontFamily: sans, fontSize: 12 }}>
              Cancele quando quiser. Sem multa, sem fidelidade.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={checkoutMonthly600k} className="lp-cta-primary">
              Assinar Agora — R$ 99/mês <span className="lp-arrow">→</span>
            </button>
            <button onClick={checkoutAnnual600k} className="lp-cta-ghost">
              Plano Anual — R$ 999
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="lp-sec lp-sec-border" style={{ background: C.navyDeep }}>
        <div className="lp-wrap">
          <div className="lp-faq-grid">
            <div>
              <div className="lp-eyebrow" style={{ marginBottom: 16 }}>§10</div>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(36px,4.5vw,56px)', lineHeight: 1.05,
                letterSpacing: '-0.025em', color: C.offWhite, fontWeight: 400 }}>
                Perguntas<br />
                <em style={{ fontStyle: 'italic', color: C.emeraldLight }}>frequentes</em>
              </h2>
            </div>
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              {FAQ.map((item, i) => <FaqItem key={i} item={item} idx={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.navyDeep, borderTop: `1px solid ${C.border}`, padding: '60px 0 40px' }}>
        <div className="lp-wrap">
          <div className="lp-footer-grid" style={{ marginBottom: 48 }}>
            <div>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <LogoIcon size={32} />
                <span style={{ fontFamily: serif, fontSize: 22, letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap', color: C.offWhite }}>
                  Sua Vaga <span style={{ color: C.emerald }}>IA</span>
                </span>
              </Link>
              <p style={{ fontSize: 14, color: C.slate, lineHeight: 1.6, maxWidth: 320, fontFamily: sans }}>
                A inteligência artificial que concretiza aprovações.
              </p>
            </div>

            <div>
              <div className="lp-eyebrow" style={{ marginBottom: 16 }}>Empresa</div>
              <p style={{ fontSize: 14, color: C.slateLight, fontFamily: sans, marginBottom: 4 }}>
                Sua Vaga Concursos — 2026
              </p>
              <p style={{ fontSize: 13, color: C.slate, fontFamily: sans }}>
                CNPJ 39.177.511/0001-19
              </p>
            </div>

            <div>
              <div className="lp-eyebrow" style={{ marginBottom: 16 }}>Endereço</div>
              <p style={{ fontSize: 14, color: C.slateLight, fontFamily: sans }}>
                Alameda Angelim, 316 — Londrina, PR
              </p>
            </div>

            <div>
              <div className="lp-eyebrow" style={{ marginBottom: 16 }}>Contato</div>
              <a href="mailto:contato@suavagaia.com.br"
                style={{ fontSize: 14, color: C.emerald, fontFamily: sans }}>
                contato@suavagaia.com.br
              </a>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24,
            display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            alignItems: 'center' }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.slate,
              letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              © {new Date().getFullYear()} Sua Vaga IA · Todos os direitos reservados
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Link to="/privacy" style={{ fontFamily: mono, fontSize: 11, color: C.slate,
                letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Privacidade
              </Link>
              <Link to="/terms" style={{ fontFamily: mono, fontSize: 11, color: C.slate,
                letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Termos
              </Link>
              <a href="mailto:contato@suavagaia.com.br" style={{ fontFamily: mono, fontSize: 11,
                color: C.slate, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Suporte
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MODAL DE SELEÇÃO DE PLANO ── */}
      {showPlanModal && (
        <div
          onClick={() => setShowPlanModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0A1628', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, maxWidth: 560, width: '100%', padding: '40px 36px',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: '#10B981', marginBottom: 12 }}>
                Escolha seu plano
              </div>
              <h3 style={{ fontFamily: serif, fontSize: 28, color: '#F8FAFC',
                fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Qual plano faz mais sentido<br />para você?
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <button
                onClick={() => { setShowPlanModal(false); checkoutMonthly600k(); }}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6, padding: '24px 20px', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'border-color .18s, background .18s', color: 'inherit',
                }}
              >
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>
                  Essencial
                </div>
                <div style={{ fontFamily: serif, fontSize: 40, color: '#F8FAFC',
                  letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
                  R$ 99
                </div>
                <div style={{ fontFamily: sans, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                  por mês
                </div>
                <div style={{ fontFamily: sans, fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>
                  600.000 tokens mensais<br />Todos os agentes inclusos
                </div>
              </button>

              <button
                onClick={() => { setShowPlanModal(false); checkoutMonthly1m(); }}
                style={{
                  background: 'rgba(16,185,129,0.06)', border: '1.5px solid #10B981',
                  borderRadius: 6, padding: '24px 20px', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'background .18s', color: 'inherit', position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute', top: -1, right: 16,
                  background: '#10B981', color: '#fff',
                  fontFamily: mono, fontSize: 9, letterSpacing: '0.15em',
                  textTransform: 'uppercase', padding: '3px 8px', borderRadius: '0 0 4px 4px',
                }}>
                  Mais Popular
                </div>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: '#34D399', marginBottom: 12 }}>
                  Premium
                </div>
                <div style={{ fontFamily: serif, fontSize: 40, color: '#34D399',
                  letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
                  R$ 129
                </div>
                <div style={{ fontFamily: sans, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                  por mês
                </div>
                <div style={{ fontFamily: sans, fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>
                  1.000.000 tokens mensais<br />Mais interações, mais estudo
                </div>
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowPlanModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: sans, fontSize: 13, color: '#64748B', padding: '8px 16px' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
