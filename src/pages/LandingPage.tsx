import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LogoIcon } from '@/components/LogoIcon';
import { toast } from 'sonner';

// ─── Price IDs Stripe ────────────────────────────────────────────────────────
const PRICE_MONTHLY = 'price_1SUXQFGmx6vYOM03NfHHL89v';
const PRICE_ANNUAL  = 'price_1SUXRUGmx6vYOM03MTVtneoX';
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
    n: 2, titulo: 'Legislação Sempre Atualizada',
    sub: 'Verificação de vigência em tempo real',
    itens: [
      'Menciona apenas os artigos relacionados ao tema solicitado',
      'Identifica artigos revogados total ou parcialmente',
      'Fornece apenas legislação, provimentos e resoluções vigentes',
    ],
    pq: 'Seleciona apenas os artigos importantes sobre o assunto estudado. Segurança jurídica nas suas respostas.',
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
    pq: 'Jurisprudência é 30% da prova em muitos concursos. Informativos esquematizados custam caro em outros sites.',
  },
  {
    n: 4, titulo: 'Súmulas STF/STJ',
    sub: 'Todas as súmulas vigentes organizadas por tema',
    itens: [
      'Todas as súmulas não canceladas sobre qualquer tema',
      'Verificação automática de cancelamento',
      'Explicação didática do entendimento de cada súmula',
      'Caso prático para cada súmula',
      'Não informará súmulas canceladas',
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
    n: 6, titulo: 'Questões Objetivas de 5 Alternativas',
    sub: 'Questões de alta qualidade como as bancas fazem',
    itens: [
      'Questões de 5 alternativas por tema',
      'Nível concurso público real',
      'Fundamentação completa de todas as alternativas',
      'Base em doutrina, súmulas, informativos e legislação vigente',
      'Justificativa detalhada do erro de cada alternativa',
      'Justificativa detalhada do acerto da alternativa correta',
    ],
    pq: 'Simulados custam caro em outros sites. Qualidade de banca organizadora. Fundamentação que ensina mais que aulas.',
  },
  {
    n: 7, titulo: 'Questões Certo/Errado',
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
    n: 8, titulo: 'Mentoria e Cronograma Personalizado',
    sub: 'Sua vida organizada para a aprovação',
    itens: [
      'Horário de acordar em cada dia da semana',
      'Trabalho, deslocamento e compromissos fixos',
      'Academia, banho e alimentação no cronograma',
      'Tempo de estudo proporcional ao peso de cada matéria',
      'Distribuição inteligente ao longo da semana',
      'Máximo 2h seguidas com intervalos de 30 minutos',
      'Aproveitamento de 100% do tempo livre',
    ],
    pq: 'Coaching/mentoria custa caro (R$ 2.000,00+). Cronograma personalizado de acordo com a sua rotina.',
  },
];

const AREAS = [
  'Direito Constitucional', 'Direito Administrativo', 'Direito Civil',
  'Direito Penal', 'Direito Processual Civil', 'Direito Processual Penal',
  'Direito Tributário', 'Direito Trabalhista', 'Direito Previdenciário',
  'Direito Empresarial', 'Português', 'Raciocínio Lógico',
  'Informática', 'Estatística', 'Arquivologia',
];

const FAQ = [
  {
    q: 'A inteligência artificial realmente funciona para concursos públicos?',
    a: 'Sim. Nossa IA foi enriquecida especificamente para concursos públicos, com as melhores doutrinas, questões no nível das bancas, legislação atualizada em tempo real e informativos de jurisprudência recentes dos Tribunais Superiores.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Você pode cancelar sua assinatura a qualquer momento, sem multa ou burocracia. O acesso continua até o fim do período pago.',
  },
  {
    q: 'A plataforma funciona no celular ou tablet?',
    a: 'Sim. Nossa plataforma é totalmente responsiva e funciona perfeitamente em celulares, tablets e computadores. Você pode estudar onde estiver, quando quiser.',
  },
  {
    q: 'Por que devo contratar o Sua Vaga IA, e não utilizar outras IAs?',
    a: 'O Sua Vaga IA é constantemente alimentado e enriquecido com as melhores doutrinas e busca apenas fontes seguras de legislação e informativos dos Tribunais Superiores. Outras IAs buscam informações de qualquer fonte da internet, o que prejudica a credibilidade e a qualidade das informações.',
  },
  {
    q: 'Quantas perguntas posso fazer com 600.000 tokens?',
    a: 'Cada pergunta aos agentes consome em média 1.500 tokens. Com 600.000 tokens mensais, você pode fazer aproximadamente 400 interações com os agentes por ciclo. Precisa de mais? Adquira pacotes avulsos de 600.000 tokens por R$49,90.',
  },
];

// ─── Tokens de cor SVA ───────────────────────────────────────────────────────
const C = {
  navyDeep:     '#060E1F',
  navyCore:     '#0A1628',
  navyMid:      '#0F1F3D',
  emerald:      '#10B981',
  emeraldLight: '#34D399',
  emeraldDark:  '#059669',
  slate:        '#64748B',
  slateLight:   '#94A3B8',
  offWhite:     '#F8FAFC',
  border:       'rgba(255,255,255,0.07)',
  borderEm:     'rgba(16,185,129,0.2)',
  red:          '#F87171',
  redBorder:    'rgba(239,68,68,0.15)',
};

const serif = "'DM Serif Display', Georgia, serif";
const sans  = "'DM Sans', system-ui, sans-serif";

// ─── Checkout helper ─────────────────────────────────────────────────────────
async function invokeCheckout(
  priceId: string,
  plan: 'monthly' | 'annual' | 'credits',
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
    const successPath = plan === 'credits' ? '/thank-you/credits' : `/thank-you/${plan}`;
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
}

function AgentCard({ ag }: { ag: AgentData }) {
  const [exp, setExp] = useState(false);
  const show = exp ? ag.itens : ag.itens.slice(0, 4);
  const more = ag.itens.length - 4;

  return (
    <div style={{ background: C.navyMid, border: `1px solid ${C.borderEm}`, borderRadius: '16px',
      display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.45)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = C.borderEm)}>

      <div style={{ padding: '22px 22px 18px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ background: 'rgba(16,185,129,0.1)', color: C.emeraldLight,
          border: `1px solid rgba(16,185,129,0.18)`, fontSize: '10px', fontWeight: 700,
          letterSpacing: '2px', textTransform: 'uppercase' as const, borderRadius: '100px',
          padding: '3px 11px', display: 'inline-block', marginBottom: '10px', fontFamily: sans }}>
          Agente {ag.n}
        </span>
        <h3 style={{ fontFamily: serif, color: C.offWhite, fontSize: '18px', fontWeight: 700,
          margin: '0 0 7px', lineHeight: 1.25 }}>{ag.titulo}</h3>
        <p style={{ fontFamily: sans, color: C.slate, fontSize: '13.5px', lineHeight: 1.6, margin: 0 }}>
          {ag.sub}
        </p>
      </div>

      <div style={{ padding: '18px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {show.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
            <div style={{ marginTop: '2px' }}><Tick size={13} /></div>
            <span style={{ fontFamily: sans, color: C.slateLight, fontSize: '13px', lineHeight: 1.55 }}>{item}</span>
          </div>
        ))}
        {more > 0 && (
          <button onClick={() => setExp(!exp)}
            style={{ color: C.emeraldLight, fontFamily: sans, fontSize: '12.5px', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0 0', textAlign: 'left' as const }}>
            {exp ? 'Mostrar menos' : `Ver mais ${more} ${more === 1 ? 'item' : 'itens'}`}
          </button>
        )}
      </div>

      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ background: 'rgba(16,185,129,0.06)', border: `1px solid rgba(16,185,129,0.15)`,
          borderRadius: '10px', padding: '13px 15px' }}>
          <p style={{ color: C.emeraldLight, fontFamily: sans, fontSize: '10px', fontWeight: 700,
            letterSpacing: '1.5px', textTransform: 'uppercase' as const, marginBottom: '5px' }}>
            Por que vale R$129/mês:
          </p>
          <p style={{ color: C.slate, fontFamily: sans, fontSize: '12.5px', lineHeight: 1.6, margin: 0 }}>
            {ag.pq}
          </p>
        </div>
      </div>
    </div>
  );
}

interface FaqItemData {
  q: string;
  a: string;
}

function FaqItem({ item }: { item: FaqItemData }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${open ? C.borderEm : C.border}`, borderRadius: '12px',
      overflow: 'hidden', transition: 'border-color 0.2s', background: open ? 'rgba(16,185,129,0.03)' : 'transparent' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
        padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
        <span style={{ fontFamily: sans, color: C.offWhite, fontSize: '15px', fontWeight: 500, lineHeight: 1.5 }}>
          {item.q}
        </span>
        <span style={{ color: C.emerald, fontSize: '22px', fontWeight: 300, flexShrink: 0, marginTop: '1px' }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <p style={{ fontFamily: sans, color: C.slateLight, fontSize: '14px',
          lineHeight: 1.75, padding: '0 24px 20px', borderTop: `1px solid ${C.border}`,
          paddingTop: '16px', margin: 0 }}>{item.a}</p>
      )}
    </div>
  );
}

// ─── Landing Page Principal ───────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  const goSignup = () => navigate('/auth/signup');

  const checkoutMonthly = () => invokeCheckout(PRICE_MONTHLY, 'monthly', navigate);
  const checkoutAnnual  = () => invokeCheckout(PRICE_ANNUAL, 'annual', navigate);
  const checkoutCredits = () => invokeCheckout(PRICE_CREDITS, 'credits', navigate);

  return (
    <div style={{ background: C.navyDeep, minHeight: '100vh', fontFamily: sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none}
        .lp-wrap{max-width:1200px;margin:0 auto}
        .lp-wrap-sm{max-width:720px;margin:0 auto}
        .lp-wrap-md{max-width:920px;margin:0 auto}
        .lp-agents{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px}
        .lp-col2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .lp-areas{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
        .lp-gtext{background:linear-gradient(90deg,#10B981,#34D399);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .lp-sec{padding:96px 20px}
        .lp-card-hover{transition:border-color 0.2s,background 0.2s}
        @media(max-width:768px){
          .lp-agents{grid-template-columns:1fr}
          .lp-col2{grid-template-columns:1fr}
          .lp-areas{grid-template-columns:repeat(2,1fr)}
          .lp-hide{display:none!important}
          .lp-sec{padding:68px 16px!important}
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,14,31,0.93)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}` }}>
        <div className="lp-wrap" style={{ padding: '13px 20px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogoIcon size={32} />
            <span style={{ fontFamily: serif, color: C.offWhite, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Sua Vaga <span style={{ color: C.emerald }}>IA</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/auth/login" className="lp-hide"
              style={{ color: C.slateLight, fontFamily: sans, fontSize: '14px', fontWeight: 500,
                padding: '8px 12px' }}>
              Entrar
            </Link>
            <button onClick={checkoutMonthly}
              style={{ background: C.emerald, color: '#fff', border: 'none', borderRadius: '10px',
                fontFamily: sans, fontWeight: 600, fontSize: '13px', padding: '9px 18px',
                cursor: 'pointer', transition: 'background 0.18s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emeraldDark)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emerald)}>
              Assinar
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="lp-sec" style={{ background: `linear-gradient(160deg,${C.navyDeep} 0%,${C.navyCore} 55%,${C.navyDeep} 100%)`,
        textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '550px', height: '550px',
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.09) 0%,transparent 70%)',
          pointerEvents: 'none' }} />
        <div className="lp-wrap-md" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(16,185,129,0.09)', border: `1px solid rgba(16,185,129,0.18)`,
            borderRadius: '100px', padding: '5px 14px', marginBottom: '28px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%',
              background: C.emerald, display: 'inline-block' }} />
            <span style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700, letterSpacing: '2px' }}>
              CONCURSOS PÚBLICOS
            </span>
          </div>

          <h1 style={{ fontFamily: serif, color: C.offWhite,
            fontSize: 'clamp(40px,7vw,68px)', fontWeight: 700,
            lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: '24px' }}>
            Transforme sua preparação{' '}
            <span className="lp-gtext">para concursos</span>
          </h1>

          <p style={{ color: C.slateLight, fontFamily: sans, fontSize: '18px',
            lineHeight: 1.75, maxWidth: '620px', margin: '0 auto 10px' }}>
            Inteligência Artificial enriquecida com as melhores doutrinas e jurisprudências atualizadas.
          </p>

          <p style={{ color: C.slate, fontFamily: sans, fontSize: '15px',
            lineHeight: 1.7, maxWidth: '540px', margin: '0 auto 36px' }}>
            Enquanto outros candidatos estudam de forma desorganizada e superficial, você terá acesso
            à primeira plataforma brasileira de preparação completa, estruturada e personalizada para
            concursos públicos de alto nível.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '36px' }}>
            {['Acesso por celular, tablet ou computador', 'Cancele a qualquer momento', 'Sem multa, sem fidelidade'].map((b, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: '100px',
                padding: '7px 16px', color: C.slateLight, fontFamily: sans, fontSize: '13px' }}>
                <Tick size={13} />
                {b}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button onClick={checkoutMonthly}
              style={{ background: C.emerald, color: '#fff', border: 'none', borderRadius: '10px',
                fontFamily: sans, fontWeight: 600, fontSize: '16px', padding: '15px 36px',
                cursor: 'pointer', transition: 'background 0.18s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emeraldDark)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emerald)}>
              Assinar Agora — R$ 129/mês
            </button>
            <Link to="/auth/signup"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', color: C.emerald, border: `2px solid ${C.emerald}`,
                borderRadius: '10px', fontFamily: sans, fontWeight: 600, fontSize: '16px',
                padding: '13px 36px', transition: 'all 0.18s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = C.emerald; (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = C.emerald; }}>
              Começar Grátis
            </Link>
          </div>
        </div>
      </section>

      {/* ── AGENTES ── */}
      <section className="lp-sec" style={{ background: C.navyCore }}>
        <div className="lp-wrap">
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <span style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
              O que você recebe por R$129/mês
            </span>
            <h2 style={{ fontFamily: serif, color: C.offWhite, fontSize: 'clamp(30px,5vw,46px)',
              fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', maxWidth: '560px', margin: '0 auto 12px' }}>
              Agentes especializados em concursos públicos
            </h2>
            <p style={{ color: C.slate, fontFamily: sans, fontSize: '15px', lineHeight: 1.7 }}>
              Cada um desenvolvido especificamente para uma área dos seus estudos.
            </p>
          </div>
          <div className="lp-agents">
            {AGENTES.map((ag) => <AgentCard key={ag.n} ag={ag} />)}
          </div>
        </div>
      </section>

      {/* ── CUSTO-BENEFÍCIO ── */}
      <section className="lp-sec" style={{ background: C.navyDeep }}>
        <div className="lp-wrap-md">
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
              Análise de Custo-Benefício
            </span>
            <h2 style={{ fontFamily: serif, color: C.offWhite, fontSize: 'clamp(30px,5vw,46px)',
              fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              Quanto você economiza todo mês
            </h2>
          </div>
          <div className="lp-col2">
            <div style={{ background: C.navyMid, border: `1px solid ${C.redBorder}`, borderRadius: '16px', padding: '30px' }}>
              <p style={{ color: C.red, fontFamily: sans, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '22px' }}>
                Sem o Sua Vaga IA
              </p>
              {[['Livros de doutrina', 'R$ 2.000+'], ['Coaching / mentoria', 'R$ 2.000+'],
                ['Simulados', 'R$ 500+'], ['Informativos', 'R$ 400+']].map(([item, val], k) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                  paddingBottom: '13px', marginBottom: '13px', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.slate, fontFamily: sans, fontSize: '14px' }}>{item}</span>
                  <span style={{ color: C.red, fontFamily: sans, fontSize: '14px', fontWeight: 700 }}>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ color: C.slateLight, fontFamily: sans, fontWeight: 600 }}>Total mensal</span>
                <span style={{ color: C.red, fontFamily: serif, fontSize: '26px', fontWeight: 700 }}>R$ 4.900+</span>
              </div>
            </div>
            <div style={{ background: C.navyMid, border: `2px solid ${C.emerald}`, borderRadius: '16px',
              padding: '30px', boxShadow: '0 0 60px rgba(16,185,129,0.1)', display: 'flex',
              flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '22px' }}>Com o Sua Vaga IA</p>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span className="lp-gtext" style={{ fontFamily: serif, fontSize: '72px', fontWeight: 700 }}>R$ 129</span>
                <span style={{ color: C.emeraldLight, fontFamily: sans, fontSize: '20px', fontWeight: 500 }}>/mês</span>
                <p style={{ color: C.slate, fontFamily: sans, fontSize: '13px', marginTop: '4px' }}>
                  ou R$ 1.290/ano (≈ R$ 107,50/mês)
                </p>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.2)`,
                borderRadius: '12px', padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ color: C.emeraldLight, fontFamily: serif, fontSize: '18px', fontWeight: 700 }}>
                  Economia de R$ 4.700,00+ por mês
                </p>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button onClick={checkoutMonthly}
              style={{ background: C.emerald, color: '#fff', border: 'none', borderRadius: '10px',
                fontFamily: sans, fontWeight: 600, fontSize: '16px', padding: '15px 36px',
                cursor: 'pointer', transition: 'background 0.18s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emeraldDark)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emerald)}>
              Assinar Agora
            </button>
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAL ── */}
      <section className="lp-sec" style={{ background: C.navyCore }}>
        <div className="lp-wrap-md" style={{ textAlign: 'center' }}>
          <span style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700,
            letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
            Nosso Diferencial
          </span>
          <h2 style={{ fontFamily: serif, color: C.offWhite, fontSize: 'clamp(30px,5vw,46px)',
            fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: '10px' }}>
            Por que o Sua Vaga IA é diferente de tudo
          </h2>
          <p style={{ color: C.slate, fontFamily: sans, fontSize: '15px', lineHeight: 1.7, marginBottom: '44px' }}>
            Primeira plataforma de IA especializada em concursos públicos
          </p>
          <div className="lp-col2" style={{ textAlign: 'left' }}>
            {[
              'Inteligência artificial enriquecida com as melhores doutrinas',
              'IA que prioriza e seleciona os últimos entendimentos jurisprudenciais',
              'Casos práticos que facilitam o entendimento de cada tema',
              'Estudo organizado, completo e personalizado para o seu edital',
            ].map((item, i) => (
              <div key={i} className="lp-card-hover" style={{ background: C.navyMid, border: `1px solid ${C.border}`,
                borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '13px' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = C.borderEm)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = C.border)}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px',
                  background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  <Tick size={14} />
                </div>
                <p style={{ color: C.slateLight, fontFamily: sans, fontSize: '14px', lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÁREAS ATENDIDAS ── */}
      <section className="lp-sec" style={{ background: C.navyDeep }}>
        <div className="lp-wrap" style={{ textAlign: 'center' }}>
          <span style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700,
            letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
            Expansão Constante
          </span>
          <h2 style={{ fontFamily: serif, color: C.offWhite, fontSize: 'clamp(30px,5vw,46px)',
            fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: '8px' }}>
            Áreas atendidas
          </h2>
          <p style={{ color: C.slate, fontFamily: sans, fontSize: '15px', marginBottom: '36px' }}>
            Disponíveis agora
          </p>
          <div className="lp-areas" style={{ marginBottom: '36px' }}>
            {AREAS.map((area, i) => (
              <div key={i} className="lp-card-hover" style={{ background: C.navyMid, border: `1px solid ${C.border}`,
                borderRadius: '12px', padding: '16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = C.borderEm)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = C.border)}>
                <span style={{ color: C.slateLight, fontFamily: sans, fontSize: '13px', fontWeight: 500, lineHeight: 1.3 }}>{area}</span>
              </div>
            ))}
          </div>
          <button onClick={checkoutMonthly}
            style={{ background: C.emerald, color: '#fff', border: 'none', borderRadius: '10px',
              fontFamily: sans, fontWeight: 600, fontSize: '16px', padding: '15px 36px',
              cursor: 'pointer', transition: 'background 0.18s' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emeraldDark)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emerald)}>
            Assinar Agora
          </button>
        </div>
      </section>

      {/* ── O QUE VOCÊ GANHA ── */}
      <section className="lp-sec" style={{ background: C.navyCore }}>
        <div className="lp-wrap-sm">
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
              Acesso imediato
            </span>
            <h2 style={{ fontFamily: serif, color: C.offWhite, fontSize: 'clamp(30px,5vw,46px)',
              fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              O que você ganha hoje
            </h2>
          </div>
          <div style={{ background: C.navyMid, border: `1px solid ${C.borderEm}`, borderRadius: '20px', padding: '30px' }}>
            {[
              'Agentes de IA especializados em concursos públicos',
              'Análise doutrinária completa de qualquer tema do edital',
              'Legislação sempre atualizada',
              'Informativos dos últimos anos (STF e STJ)',
              'Todas as súmulas vigentes com casos práticos',
              'Súmulas vinculantes explicadas e com casos práticos',
              'Questões objetivas com explicação de cada alternativa',
              'Questões certo/errado com explicação e fundamentação',
              'Mentoria e gestão personalizada do tempo',
              '600.000 tokens por ciclo (≈ 400 interações)',
              'Atualizações constantes',
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '11px',
                paddingBottom: i < arr.length - 1 ? '13px' : 0,
                marginBottom: i < arr.length - 1 ? '13px' : 0,
                borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <Tick size={14} />
                <span style={{ color: C.slateLight, fontFamily: sans, fontSize: '14.5px' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button onClick={checkoutMonthly}
              style={{ background: C.emerald, color: '#fff', border: 'none', borderRadius: '10px',
                fontFamily: sans, fontWeight: 600, fontSize: '16px', padding: '15px 36px',
                cursor: 'pointer', transition: 'background 0.18s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emeraldDark)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emerald)}>
              Assinar Agora
            </button>
          </div>
        </div>
      </section>

      {/* ── ECONOMIA DE TEMPO ── */}
      <section className="lp-sec" style={{ background: C.navyDeep }}>
        <div className="lp-wrap-md">
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
              Eficiência
            </span>
            <h2 style={{ fontFamily: serif, color: C.offWhite, fontSize: 'clamp(30px,5vw,46px)',
              fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              Quanto tempo você vai economizar
            </h2>
          </div>
          <div className="lp-col2">
            <div style={{ background: C.navyMid, border: `1px solid ${C.redBorder}`, borderRadius: '16px', padding: '26px' }}>
              <p style={{ color: C.red, fontFamily: sans, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '18px' }}>
                Sem o Sua Vaga IA
              </p>
              {['Pesquisar legislação manualmente', 'Encontrar súmulas por conta própria',
                'Buscar informativos dispersos', 'Pesquisar questões em vários sites',
                'Organizar cronograma ou pagar mentoria'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '11px' }}>
                  <span style={{ color: '#EF4444', fontFamily: 'monospace', marginTop: '1px', flexShrink: 0 }}>—</span>
                  <span style={{ color: C.slate, fontFamily: sans, fontSize: '14px' }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.navyMid, border: `1px solid ${C.borderEm}`, borderRadius: '16px', padding: '26px' }}>
              <p style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '18px' }}>
                Com o Sua Vaga IA
              </p>
              {['Todo o conteúdo pronto e organizado', 'Economia de tempo e dinheiro',
                'Legislação sempre atualizada', 'Melhores doutrinas sobre o tema',
                'Informativos de jurisprudência atualizados', 'Questões de concursos para fixação',
                'Casos práticos para entendimento', 'Mentoria e gestão do tempo'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '11px' }}>
                  <div style={{ marginTop: '2px' }}><Tick size={13} /></div>
                  <span style={{ color: C.slateLight, fontFamily: sans, fontSize: '14px' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section className="lp-sec" style={{ background: C.navyCore }}>
        <div className="lp-wrap" style={{ textAlign: 'center' }}>
          <span style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700,
            letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
            Comece hoje mesmo
          </span>
          <h2 style={{ fontFamily: serif, color: C.offWhite, fontSize: 'clamp(30px,5vw,46px)',
            fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: '10px' }}>
            Escolha seu plano
          </h2>
          <p style={{ color: C.slate, fontFamily: sans, fontSize: '15px', lineHeight: 1.7, marginBottom: '16px' }}>
            Sem multa, sem fidelidade — cancele quando quiser.
          </p>

          {/* Cards de plano */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center',
            alignItems: 'flex-start', marginBottom: '40px', padding: '16px 0' }}>
            {/* Grátis */}
            <div style={{ background: 'rgba(15,31,61,0.5)', border: `2px solid ${C.border}`, borderRadius: '20px',
              padding: '32px 28px', flex: '1 1 240px', minWidth: '220px', maxWidth: '300px',
              display: 'flex', flexDirection: 'column', gap: '0' }}>
              <p style={{ color: C.slate, fontFamily: sans, fontSize: '12px', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Grátis</p>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontFamily: serif, color: C.offWhite, fontSize: '52px', fontWeight: 700, letterSpacing: '-1px' }}>R$ 0</span>
              </div>
              <p style={{ color: C.slate, fontFamily: sans, fontSize: '12px', marginBottom: '0' }}>para sempre</p>
              <div style={{ height: '1px', background: C.border, margin: '22px 0' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {['Acesso limitado aos agentes', '5 gerações de cronograma de mentoria', 'Explorar a plataforma sem compromisso'].map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <div style={{ marginTop: '2px' }}><Tick size={13} color={C.slate} /></div>
                    <span style={{ color: C.slate, fontFamily: sans, fontSize: '13.5px', lineHeight: 1.5 }}>{b}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/signup"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                  background: 'transparent', color: C.emerald, border: `2px solid ${C.emerald}`,
                  borderRadius: '10px', fontFamily: sans, fontWeight: 600, fontSize: '14.5px',
                  padding: '11px 24px', transition: 'all 0.18s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = C.emerald; (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = C.emerald; }}>
                Começar Grátis
              </Link>
            </div>

            {/* Mensal */}
            <div style={{ background: C.navyMid, border: `2px solid ${C.emerald}`, borderRadius: '20px',
              padding: '32px 28px', flex: '1 1 240px', minWidth: '220px', maxWidth: '340px',
              display: 'flex', flexDirection: 'column', position: 'relative',
              boxShadow: '0 0 60px rgba(16,185,129,0.12)' }}>
              <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                background: C.emerald, color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
                borderRadius: '100px', padding: '4px 14px', whiteSpace: 'nowrap', fontFamily: sans }}>
                Mais Popular
              </span>
              <p style={{ color: C.emerald, fontFamily: sans, fontSize: '12px', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Mensal</p>
              <div style={{ marginBottom: '4px' }}>
                <span className="lp-gtext" style={{ fontFamily: serif, fontSize: '60px', fontWeight: 700, letterSpacing: '-1px' }}>R$ 129</span>
                <span style={{ color: C.emeraldLight, fontFamily: sans, fontSize: '16px' }}>/mês</span>
              </div>
              <div style={{ height: '1px', background: C.border, margin: '22px 0' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {['600.000 tokens por mês', 'Todos os agentes especializados',
                  'Informativos STF/STJ atualizados', 'Súmulas vigentes com casos práticos',
                  'Mentoria e cronograma personalizados', 'Questões objetivas e certo/errado',
                  'Cancele a qualquer momento'].map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <div style={{ marginTop: '2px' }}><Tick size={13} /></div>
                    <span style={{ color: C.slateLight, fontFamily: sans, fontSize: '13.5px', lineHeight: 1.5 }}>{b}</span>
                  </li>
                ))}
              </ul>
              <button onClick={checkoutMonthly}
                style={{ background: C.emerald, color: '#fff', border: 'none', borderRadius: '10px',
                  fontFamily: sans, fontWeight: 600, fontSize: '14.5px', padding: '11px 24px',
                  cursor: 'pointer', transition: 'background 0.18s', width: '100%' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emeraldDark)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emerald)}>
                Assinar Agora
              </button>
            </div>

            {/* Anual */}
            <div style={{ background: 'rgba(15,31,61,0.5)', border: `2px solid ${C.border}`, borderRadius: '20px',
              padding: '32px 28px', flex: '1 1 240px', minWidth: '220px', maxWidth: '300px',
              display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(16,185,129,0.15)', color: C.emeraldLight, border: `1px solid rgba(16,185,129,0.3)`,
                fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
                borderRadius: '100px', padding: '4px 14px', whiteSpace: 'nowrap', fontFamily: sans }}>
                Melhor Custo-Benefício
              </span>
              <p style={{ color: C.slate, fontFamily: sans, fontSize: '12px', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Anual</p>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontFamily: serif, color: C.offWhite, fontSize: '52px', fontWeight: 700, letterSpacing: '-1px' }}>R$ 1.290</span>
              </div>
              <p style={{ color: C.slate, fontFamily: sans, fontSize: '12px', marginBottom: '0' }}>≈ R$ 107,50/mês</p>
              <div style={{ height: '1px', background: C.border, margin: '22px 0' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {['600.000 tokens por ciclo', 'Todos os benefícios do plano Mensal',
                  'Economia de R$ 258,00 vs mensal', 'Acesso por 12 meses garantido'].map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <div style={{ marginTop: '2px' }}><Tick size={13} color={C.slate} /></div>
                    <span style={{ color: C.slate, fontFamily: sans, fontSize: '13.5px', lineHeight: 1.5 }}>{b}</span>
                  </li>
                ))}
              </ul>
              <button onClick={checkoutAnnual}
                style={{ background: 'transparent', color: C.emerald, border: `2px solid ${C.emerald}`,
                  borderRadius: '10px', fontFamily: sans, fontWeight: 600, fontSize: '14.5px',
                  padding: '11px 24px', cursor: 'pointer', transition: 'all 0.18s', width: '100%' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.emerald; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = C.emerald; }}>
                Assinar Anual
              </button>
            </div>
          </div>

          {/* Créditos avulsos */}
          <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: '16px',
            padding: '24px 28px', maxWidth: '560px', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p style={{ color: C.slateLight, fontFamily: sans, fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                  Pacote de Créditos Avulsos
                </p>
                <p style={{ color: C.slate, fontFamily: sans, fontSize: '13.5px' }}>
                  600.000 tokens adicionais por R$ 49,90
                </p>
              </div>
              <button onClick={checkoutCredits}
                style={{ background: 'transparent', color: C.slateLight, border: `1px solid ${C.border}`,
                  borderRadius: '8px', fontFamily: sans, fontWeight: 600, fontSize: '13px',
                  padding: '9px 18px', cursor: 'pointer', transition: 'all 0.18s', flexShrink: 0 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLButtonElement).style.color = C.offWhite; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.slateLight; }}>
                Comprar Créditos
              </button>
            </div>
          </div>

          {/* Pagamento */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '24px', marginTop: '28px', flexWrap: 'wrap' }}>
            {['Cartão de crédito', 'Apple Pay', 'Link (Stripe)'].map((p, i) => (
              <span key={i} style={{ color: C.slate, fontFamily: sans, fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tick size={12} color={C.slate} />{p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── NÃO PERCA TEMPO ── */}
      <section className="lp-sec" style={{ background: `linear-gradient(160deg,${C.navyCore} 0%,${C.navyDeep} 100%)`,
        textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '350px',
          background: 'radial-gradient(ellipse at top,rgba(16,185,129,0.07) 0%,transparent 60%)',
          pointerEvents: 'none' }} />
        <div className="lp-wrap-md" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: serif, color: C.offWhite, fontSize: 'clamp(34px,6vw,58px)',
            fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: '22px' }}>
            Não perca tempo
          </h2>
          <p style={{ color: C.slateLight, fontFamily: sans, fontSize: '18px', lineHeight: 1.75,
            maxWidth: '580px', margin: '0 auto 18px' }}>
            Enquanto você está lendo isso, centenas de candidatos já estão usando a
            inteligência artificial para estudar de forma mais eficiente.
          </p>
          <p style={{ color: C.offWhite, fontFamily: sans, fontSize: '17px', fontWeight: 500, marginBottom: '10px' }}>
            A pergunta não é <em>se</em> você vai precisar dominar IA nos estudos.
          </p>
          <p style={{ color: C.emeraldLight, fontFamily: serif, fontSize: '22px', fontWeight: 700, marginBottom: '40px' }}>
            A pergunta é: você vai estar na frente ou atrás dos outros candidatos?
          </p>
          <div style={{ background: 'rgba(15,31,61,0.7)', border: `1px solid ${C.borderEm}`,
            borderRadius: '16px', padding: '22px 28px', maxWidth: '480px', margin: '0 auto 28px' }}>
            <p style={{ color: C.slate, fontFamily: sans, fontSize: '11px', fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Ação imediata</p>
            <p style={{ color: C.slateLight, fontFamily: sans, fontSize: '14px', lineHeight: 1.65, marginBottom: '6px' }}>
              Garanta sua vaga entre os primeiros 1000 usuários com desconto.
            </p>
            <p style={{ color: C.slate, fontFamily: sans, fontSize: '12px' }}>Cancele quando quiser. Sem multa, sem fidelidade.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
            <button onClick={checkoutMonthly}
              style={{ background: C.emerald, color: '#fff', border: 'none', borderRadius: '10px',
                fontFamily: sans, fontWeight: 600, fontSize: '16px', padding: '15px 36px',
                cursor: 'pointer', transition: 'background 0.18s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emeraldDark)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = C.emerald)}>
              Assinar Agora — R$ 129/mês
            </button>
            <button onClick={checkoutAnnual}
              style={{ background: 'transparent', color: C.emerald, border: `2px solid ${C.emerald}`,
                borderRadius: '10px', fontFamily: sans, fontWeight: 600, fontSize: '16px',
                padding: '13px 36px', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.emerald; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = C.emerald; }}>
              Plano Anual — R$ 1.290
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-sec" style={{ background: C.navyCore }}>
        <div className="lp-wrap-sm">
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span style={{ color: C.emerald, fontFamily: sans, fontSize: '11px', fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
              Dúvidas frequentes
            </span>
            <h2 style={{ fontFamily: serif, color: C.offWhite, fontSize: 'clamp(30px,5vw,46px)',
              fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              Perguntas frequentes
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FAQ.map((item, i) => <FaqItem key={i} item={item} />)}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.navyDeep, borderTop: `1px solid ${C.border}`, padding: '52px 20px 32px' }}>
        <div className="lp-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
            gap: '36px', marginBottom: '36px' }}>
            <div>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LogoIcon size={32} />
                <span style={{ fontFamily: serif, color: C.offWhite, fontSize: '20px', fontWeight: 700 }}>
                  Sua Vaga <span style={{ color: C.emerald }}>IA</span>
                </span>
              </Link>
              <p style={{ color: C.slate, fontFamily: sans, fontSize: '13px', lineHeight: 1.65, marginTop: '12px' }}>
                A inteligência artificial que concretiza aprovações.
              </p>
            </div>
            <div>
              <p style={{ color: C.slate, fontFamily: sans, fontSize: '10px', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Empresa</p>
              <p style={{ color: C.slateLight, fontFamily: sans, fontSize: '13px', marginBottom: '4px' }}>
                Sua Vaga Concursos — 2026
              </p>
              <p style={{ color: C.slate, fontFamily: sans, fontSize: '13px' }}>CNPJ 39.177.511/0001-19</p>
            </div>
            <div>
              <p style={{ color: C.slate, fontFamily: sans, fontSize: '10px', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Endereço</p>
              <p style={{ color: C.slateLight, fontFamily: sans, fontSize: '13px', marginBottom: '14px' }}>
                Alameda Angelim, 316 — Londrina, PR
              </p>
              <p style={{ color: C.slate, fontFamily: sans, fontSize: '10px', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '7px' }}>Contato</p>
              <a href="mailto:contato@suavagaia.com.br"
                style={{ color: C.emerald, fontFamily: sans, fontSize: '13px' }}>
                contato@suavagaia.com.br
              </a>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '22px',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ color: C.slate, fontFamily: sans, fontSize: '12px' }}>
              © {new Date().getFullYear()} Sua Vaga IA. Todos os direitos reservados.
            </p>
            <div style={{ display: 'flex', gap: '22px' }}>
              <Link to="/privacy" style={{ color: C.slate, fontFamily: sans, fontSize: '12px' }}>
                Política de Privacidade
              </Link>
              <Link to="/terms" style={{ color: C.slate, fontFamily: sans, fontSize: '12px' }}>
                Termos de Uso
              </Link>
              <a href="mailto:contato@suavagaia.com.br" style={{ color: C.slate, fontFamily: sans, fontSize: '12px' }}>
                Suporte
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
