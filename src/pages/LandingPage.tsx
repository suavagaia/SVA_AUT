import { useEffect, useState } from 'react';
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

function AgentRow({ ag }: { ag: AgentData }) {
  const [exp, setExp] = useState(false);
  const show = exp ? ag.itens : ag.itens.slice(0, 4);
  const more = ag.itens.length - 4;

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
            Por que vale R$ 129/mês
          </div>
          <p style={{ fontSize: 13, color: C.slateLighter, lineHeight: 1.6, fontFamily: sans }}>{ag.pq}</p>
        </div>
      </div>

      <div>
        <div className="lp-eyebrow-muted" style={{ fontSize: 10, marginBottom: 16 }}>
          O que inclui · {ag.itens.length} items
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
        @media(max-width:540px){
          .lp-areas-grid{grid-template-columns:1fr}
          .lp-area-cell:nth-child(odd){border-right:none!important}
        }
        .lp-hero-grid{display:grid;grid-template-columns:auto 1fr;gap:40px;align-items:start}
        .lp-hero-numeral{font-family:${serif};font-size:clamp(60px,9vw,140px);line-height:.95;letter-spacing:-.04em;color:${C.slate};opacity:.22}
        .lp-hero-h1{font-family:${serif};font-size:clamp(48px,7vw,96px);line-height:1.02;letter-spacing:-.03em;color:${C.offWhite};margin-bottom:32px}
        .lp-hero-h1 em{font-style:italic;color:${C.emeraldLight}}
        .lp-hero-trust{margin-top:80px;padding-top:32px;border-top:1px solid ${C.border};display:grid;grid-template-columns:repeat(3,1fr);gap:32px}
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
          .lp-hero-trust{grid-template-columns:1fr;gap:20px}
        }
        @media(max-width:768px){
          .lp-agents{grid-template-columns:1fr}
          .lp-col2{grid-template-columns:1fr}
          .lp-areas{grid-template-columns:repeat(2,1fr)}
          .lp-hide{display:none!important}
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
      <section style={{ position: 'relative', padding: '80px 0 120px', overflow: 'hidden' }}>
        {/* backdrop glows */}
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-15%', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(59,130,246,0.04) 0%,transparent 60%)', pointerEvents: 'none' }} />

        <div className="lp-wrap" style={{ position: 'relative' }}>
          {/* meta row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 80, flexWrap: 'wrap', gap: 16 }}>
            <div className="lp-eyebrow-muted">
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: C.emerald, marginRight: 10, verticalAlign: 'middle' }} />
              Edição 2026 / Vol.01
            </div>
            <div className="lp-eyebrow-muted">Concursos Públicos — Jurídicos</div>
          </div>

          {/* headline grid */}
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
                  <button onClick={checkoutMonthly} className="lp-cta-primary">
                    Assinar Agora — R$ 129/mês
                    <span className="lp-arrow">→</span>
                  </button>
                  <Link to="/auth/signup" className="lp-cta-ghost">Começar Grátis</Link>
                </div>
              </div>
            </div>
          </div>

          {/* trust strip */}
          <div className="lp-hero-trust">
            {[
              ['Dispositivo', 'Acesso por celular, tablet ou computador'],
              ['Flexibilidade', 'Cancele a qualquer momento'],
              ['Compromisso', 'Sem multa, sem fidelidade'],
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
                O que você recebe por R$ 129/mês
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
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div style={{ fontFamily: serif, fontSize: 112, lineHeight: 0.9,
                  letterSpacing: '-0.04em', color: C.offWhite, marginBottom: 4, whiteSpace: 'nowrap' }}>
                  R$ 129
                </div>
                <div className="lp-eyebrow">por mês</div>
                <div style={{ fontSize: 13, color: C.slate, marginTop: 8, fontFamily: sans }}>
                  ou R$ 1.290/ano (≈ R$ 107,50/mês)
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${C.borderEm}`, paddingTop: 20, textAlign: 'center' }}>
                <div style={{ fontFamily: serif, fontSize: 22, color: C.emeraldLight,
                  letterSpacing: '-0.01em', fontStyle: 'italic' }}>
                  Economia de R$ 4.700,00+ por mês
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <button onClick={checkoutMonthly} className="lp-cta-primary">
              Assinar Agora <span className="lp-arrow">→</span>
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
            <button onClick={checkoutMonthly} className="lp-cta-primary">
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
            ].map((item, i) => (
              <li key={i} style={{ display: 'grid', gridTemplateColumns: '50px 24px 1fr',
                gap: 16, alignItems: 'center', padding: '18px 0',
                borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.slate, letterSpacing: '0.1em' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Tick size={14} />
                <span style={{ fontSize: 16, color: C.offWhite,
                  letterSpacing: '-0.005em', fontFamily: sans }}>{item}</span>
              </li>
            ))}
          </ul>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <button onClick={checkoutMonthly} className="lp-cta-primary">
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
