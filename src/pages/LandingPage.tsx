import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { LogoIcon } from '@/components/LogoIcon';

/* ───── Scroll animation hook ───── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Section({ children, className = '', id, style }: { children: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties }) {
  const ref = useScrollReveal();
  return <section id={id} ref={ref} style={style} className={`animate-on-scroll ${className}`}>{children}</section>;
}

/* ───── Data ───── */
const agents = [
  { emoji: '📚', title: 'Análise Doutrinária', subtitle: 'Sua biblioteca jurídica pessoal com IA', highlights: ['Definições dos principais doutrinadores', 'Evolução histórica do instituto', 'Classificações e tipos detalhados', 'Exemplos práticos para fixação'], value: 'Substitui 10+ livros (R$2.000+)' },
  { emoji: '⚖️', title: 'Legislação Atualizada', subtitle: 'Verificação de vigência em tempo real', highlights: ['Apenas artigos relacionados ao tema', 'Identifica artigos revogados', 'Legislação, provimentos e resoluções vigentes', 'Segurança jurídica nas respostas'], value: 'Economia de horas de pesquisa' },
  { emoji: '🔍', title: 'Informativos STF/STJ', subtitle: 'Jurisprudência atualizada na palma da mão', highlights: ['Informativos por tema solicitado', 'Prioriza entendimentos recentes', 'Casos práticos após cada informativo', 'Formato estruturado para concursos'], value: '30% da prova em muitos concursos' },
  { emoji: '📋', title: 'Súmulas STF/STJ', subtitle: 'Vigentes e organizadas por tema', highlights: ['Verificação automática de cancelamento', 'Explicação didática de cada súmula', 'Caso prático para cada súmula', 'Organização temática completa'], value: 'Economiza horas de pesquisa' },
  { emoji: '🏛️', title: 'Súmulas Vinculantes', subtitle: 'Todas por tema com casos práticos', highlights: ['Base na Lei 11.417/06', 'Casos práticos de aplicação', 'Efeito vinculante explicado', 'Aplicação em órgãos públicos'], value: 'Caem muito em concursos' },
  { emoji: '✅', title: 'Questões Objetivas', subtitle: '5 alternativas como as bancas fazem', highlights: ['Nível concurso público real', 'Fundamentação de todas as alternativas', 'Base em doutrina e legislação vigente', 'Selecione questões por tema'], value: 'Qualidade de banca organizadora' },
  { emoji: '🎯', title: 'Questões C/E', subtitle: 'Formato CESPE/CEBRASPE dominado', highlights: ['Estilo pegadinha típico das bancas', 'Precisão técnica exigida', 'Fundamentação que ensina a lógica', 'Base em fontes oficiais'], value: 'Especialização CESPE/CEBRASPE' },
  { emoji: '📅', title: 'Mentoria & Cronograma', subtitle: 'Sua vida organizada para aprovação', highlights: ['Cronograma baseado na sua rotina', 'Tempo proporcional ao peso de cada matéria', 'Máximo 2h seguidas + intervalos', '100% do tempo livre aproveitado'], value: 'Coaching custa R$2.000+' },
];

const areas = [
  { name: 'Magistratura', count: 3 }, { name: 'Ministério Público', count: 3 }, { name: 'Delegado de Polícia', count: 2 },
  { name: 'Cartórios', count: 1 }, { name: 'Procuradorias', count: 4 }, { name: 'Tribunais', count: 1 },
  { name: 'Carreiras Policiais', count: 7 }, { name: 'OAB', count: 1 }, { name: 'Carreiras Administrativas', count: 1 },
];
const areasFuture = ['Defensoria Pública', 'Carreiras Fiscais'];

const faqs = [
  { q: 'Isso realmente funciona para concursos?', a: 'Sim. Nossos agentes não são um ChatGPT genérico. São alimentados com doutrina dos principais autores brasileiros, legislação vigente e jurisprudência atualizada dos Tribunais Superiores. Cada resposta é estruturada no formato que bancas cobram.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem multa, sem fidelidade, sem pegadinha. Cancele pelo painel quando quiser e não será cobrado no próximo ciclo.' },
  { q: 'Substitui meu cursinho?', a: 'A Sua Vaga IA é complementar. Ela substitui livros de doutrina, banco de questões, informativos e mentoria — economizando mais de R$4.900/mês. Muitos alunos usam junto com videoaulas e relatam que o estudo ficou muito mais organizado.' },
  { q: 'Quais formas de pagamento?', a: 'Cartão de crédito e PIX. No plano anual (R$1.290 à vista), você economiza o equivalente a 2 meses.' },
  { q: 'Os conteúdos ficam desatualizados?', a: 'Não. A legislação e jurisprudência são verificadas em tempo real. Informativos dos Tribunais Superiores são incorporados assim que publicados. Se uma lei muda hoje, amanhã o agente já responde com a versão atualizada.' },
];

/* ───── Component ───── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen font-sans" style={{ background: '#080C10', color: '#F2F4F7' }}>
      {/* Grain */}
      <div className="grain-overlay" />

      {/* ═══ 1. NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: 'rgba(8,12,16,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <LogoIcon size={32} />
            <span className="text-lg font-semibold text-lp-text">Sua Vaga <span className="text-lp-green">IA</span></span>
          </div>
            <span className="text-lg font-semibold text-lp-text">Sua Vaga <span className="text-lp-green">IA</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth/login" className="text-sm text-lp-text-secondary hover:text-lp-text transition-colors">Entrar</Link>
            <Link to="/auth/signup">
              <button className="rounded-full px-5 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: '#2ECC71', color: '#080C10', boxShadow: '0 4px 15px rgba(46,204,113,0.3)' }}>
                Criar Conta Gratuita
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ 2. HERO ═══ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(46,204,113,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col items-center" style={{ animationDelay: '0s' }}>
          {/* Badge */}
          <span className="mb-8 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm"
            style={{ border: '1px solid rgba(46,204,113,0.15)', background: 'rgba(46,204,113,0.08)', color: '#98A2B3' }}>
            <span className="animate-pulse-badge text-lp-green">✦</span> Primeira plataforma de IA para concursos
          </span>

          {/* H1 */}
          <h1 className="font-serif font-normal max-w-3xl" style={{ fontSize: 'clamp(48px, 7vw, 80px)', lineHeight: 1.05, color: '#F2F4F7' }}>
            Passe no seu concurso<br />
            com <em className="text-lp-green">inteligência artificial.</em>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-[580px] text-lg leading-relaxed" style={{ color: '#98A2B3' }}>
            Doutrina, jurisprudência, questões e cronograma personalizado — 8 agentes de IA especializados trabalhando por você por{' '}
            <strong className="text-lp-text">R$129/mês</strong>.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button onClick={() => scrollTo('pricing')}
              className="rounded-full px-8 py-3.5 text-base font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: '#2ECC71', color: '#080C10', boxShadow: '0 8px 30px rgba(46,204,113,0.3)' }}>
              Começar agora →
            </button>
            <button onClick={() => scrollTo('demo')}
              className="rounded-full px-8 py-3.5 text-base font-medium transition-all hover:-translate-y-0.5"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F4F7' }}>
              Ver como funciona
            </button>
          </div>

          {/* Trust */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" style={{ color: '#667085' }}>
            {['Celular, tablet ou PC', 'Cancele a qualquer momento', 'Sem multa, sem fidelidade'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-lp-green text-xs">●</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3. AUTHORITY BAR ═══ */}
      <Section>
        <div className="py-10 px-4" style={{ background: '#0F1419', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-8 md:grid-cols-4">
            {[{ n: '8', l: 'Agentes especializados' }, { n: '23+', l: 'Concursos cobertos' }, { n: '11', l: 'Áreas do Direito' }, { n: '24/7', l: 'Sempre disponível' }].map(m => (
              <div key={m.n} className="text-center">
                <div className="font-serif text-4xl text-lp-green">{m.n}</div>
                <div className="mt-1 text-sm text-lp-text-muted">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 4. PROBLEM ═══ */}
      <Section className="px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-semibold uppercase tracking-widest text-lp-green mb-4">O Problema</p>
          <h2 className="font-serif font-normal" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, color: '#F2F4F7' }}>
            Estudar para concurso não deveria<br />custar uma fortuna.
          </h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {[
              { emoji: '💸', title: 'Material caro e disperso', text: 'Livros de doutrina, banco de questões, informativos, mentoria — tudo separado, tudo caro. Facilmente R$4.900/mês se quiser ter uma preparação completa.' },
              { emoji: '😰', title: 'A sensação de estar ficando para trás', text: 'Você estuda, mas não sabe se está estudando certo. O edital é enorme, o tempo é curto, e parece que todo mundo está mais preparado que você.' },
              { emoji: '⚖️', title: 'Preparação completa não pode ser privilégio', text: 'Não é justo que só quem pode investir milhares por mês tenha acesso a doutrina de qualidade, jurisprudência organizada e questões bem fundamentadas.' },
            ].map(c => (
              <div key={c.title} className="rounded-[20px] p-8 transition-all duration-300 hover:-translate-y-1"
                style={{ background: '#0F1419', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-3xl mb-4">{c.emoji}</div>
                <h3 className="font-serif text-xl text-lp-text mb-3">{c.title}</h3>
                <p className="text-sm leading-relaxed text-lp-text-secondary">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 5. GUIDE + PLAN ═══ */}
      <Section className="px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-semibold uppercase tracking-widest text-lp-green mb-4">A Solução</p>
          <h2 className="font-serif font-normal" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, color: '#F2F4F7' }}>
            Sua Vaga IA organiza tudo para você.
          </h2>
          <p className="mt-5 max-w-2xl text-lp-text-secondary leading-relaxed">
            A primeira plataforma de IA feita exclusivamente para concursos públicos. Não é um ChatGPT genérico — são 8 agentes treinados com doutrina real, legislação vigente e jurisprudência dos Tribunais Superiores.
          </p>

          {/* 3 Steps */}
          <div className="mt-16 grid gap-5 md:grid-cols-3 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[17%] right-[17%] border-t border-dashed" style={{ borderColor: 'rgba(46,204,113,0.2)' }} />
            {[
              { n: '1', t: 'Crie sua conta', d: 'Leva menos de 1 minuto. Sem cartão para começar.' },
              { n: '2', t: 'Escolha seu concurso', d: 'Magistratura, MP, Delegado, Cartórios, OAB e mais 6 áreas.' },
              { n: '3', t: 'Estude com IA', d: '8 agentes especializados entregam doutrina, legislação, questões e cronograma sob demanda.' },
            ].map(s => (
              <div key={s.n} className="relative rounded-2xl p-7 text-center"
                style={{ background: '#0F1419', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="font-serif text-5xl text-lp-green mb-3">{s.n}</div>
                <h3 className="font-serif text-xl text-lp-text mb-2">{s.t}</h3>
                <p className="text-sm text-lp-text-secondary">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 6. DEMO ═══ */}
      <Section id="demo" className="px-4 py-24 md:py-32 scroll-mt-20">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-semibold uppercase tracking-widest text-lp-green mb-4">Veja na prática</p>
          <h2 className="font-serif font-normal mb-12" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, color: '#F2F4F7' }}>
            Pergunte qualquer tema do edital.
          </h2>

          <div className="rounded-3xl overflow-hidden" style={{ background: '#0F1419', border: '1px solid rgba(255,255,255,0.06)' }}>
            {/* macOS bar */}
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: '#FF5F57' }} />
                <span className="h-3 w-3 rounded-full" style={{ background: '#FEBC2E' }} />
                <span className="h-3 w-3 rounded-full" style={{ background: '#28C840' }} />
              </div>
              <span className="ml-3 text-xs text-lp-text-muted">Sua Vaga IA — Agente de Análise Doutrinária</span>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-md rounded-[20px_20px_4px_20px] px-5 py-3 text-sm font-medium"
                  style={{ background: '#2ECC71', color: '#080C10' }}>
                  Explique os requisitos da prisão preventiva segundo a doutrina majoritária
                </div>
              </div>

              {/* AI response */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: 'rgba(46,204,113,0.15)', color: '#2ECC71' }}>✦</div>
                <div className="rounded-2xl px-5 py-4 max-w-2xl space-y-4" style={{ background: '#1A222B' }}>
                  <p className="font-semibold text-lp-text">📚 Análise Doutrinária — Prisão Preventiva</p>
                  <div>
                    <p className="text-sm font-semibold text-lp-green mb-1">Conceito:</p>
                    <p className="text-sm text-lp-text-secondary leading-relaxed">
                      A prisão preventiva é medida cautelar de natureza pessoal, prevista nos arts. 311 a 316 do CPP, que consiste na privação da liberdade do acusado antes do trânsito em julgado da sentença condenatória.
                    </p>
                  </div>
                  <div className="pl-4" style={{ borderLeft: '2px solid rgba(46,204,113,0.3)' }}>
                    <p className="text-sm font-semibold text-lp-text mb-1">Requisitos (Norberto Avena, Renato Brasileiro):</p>
                    <p className="text-sm text-lp-text-secondary leading-relaxed">
                      Prova da existência do crime (materialidade) e indício suficiente de autoria, cumulados com pelo menos uma das hipóteses do art. 312 do CPP...
                    </p>
                  </div>
                  <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.15)' }}>
                    <span className="text-lp-green">✦</span> <span className="text-lp-text-secondary">Resposta completa com 12 tópicos, classificações, e caso prático…</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 7. AGENTS ═══ */}
      <Section className="px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-semibold uppercase tracking-widest text-lp-green mb-4">Seu arsenal completo</p>
          <h2 className="font-serif font-normal" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, color: '#F2F4F7' }}>
            8 agentes trabalhando por você.
          </h2>
          <p className="mt-4 text-lp-text-secondary">Cada um especializado em uma área dos seus estudos — tudo por R$129/mês.</p>

          <div className="mt-14 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {agents.map((a, i) => {
              const isOpen = expandedAgent === i;
              return (
                <div key={i} onClick={() => setExpandedAgent(isOpen ? null : i)}
                  className="cursor-pointer rounded-[20px] p-6 transition-all duration-300"
                  style={{
                    background: '#0F1419',
                    border: isOpen ? '1px solid rgba(46,204,113,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isOpen ? '0 -4px 20px rgba(46,204,113,0.1)' : 'none',
                    transform: isOpen ? 'translateY(-4px)' : 'none',
                  }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl mb-2">{a.emoji}</div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-lp-green">Agente {i + 1}</p>
                      <h3 className="font-serif text-lg text-lp-text mt-0.5">{a.title}</h3>
                      <p className="text-sm italic text-lp-text-muted mt-1">{a.subtitle}</p>
                    </div>
                    <span className="text-lp-text-muted text-xl transition-transform duration-300" style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
                  </div>
                  {isOpen && (
                    <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      {a.highlights.map(h => (
                        <p key={h} className="flex items-start gap-2 text-sm text-lp-text-secondary">
                          <span className="text-lp-green mt-0.5">✓</span> {h}
                        </p>
                      ))}
                      <p className="text-sm font-semibold text-lp-green mt-3">{a.value}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══ 8. FAILURE vs SUCCESS ═══ */}
      <Section className="px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-semibold uppercase tracking-widest text-lp-green mb-4 text-center">A escolha é sua</p>
          <h2 className="font-serif font-normal text-center" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, color: '#F2F4F7' }}>
            Dois caminhos. Um resultado.
          </h2>

          <div className="mt-14 mx-auto grid max-w-[800px] gap-5 md:grid-cols-2">
            {/* Failure */}
            <div className="rounded-[20px] p-8" style={{ background: '#0F1419', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-lp-coral mb-6">● Continuar como está</p>
              <div className="space-y-3">
                {['Gastar R$4.900+/mês em materiais separados', 'Estudar de forma desorganizada e insegura', 'Não saber se a legislação está atualizada', 'Perder tempo procurando jurisprudência', 'Ver outros candidatos passando na sua frente'].map(t => (
                  <p key={t} className="flex items-start gap-2 text-sm text-lp-text-secondary">
                    <span className="text-lp-coral mt-0.5">✗</span> {t}
                  </p>
                ))}
              </div>
              <p className="mt-6 text-lg text-lp-coral line-through">R$ 4.900+/mês</p>
            </div>

            {/* Success */}
            <div className="relative rounded-[20px] p-8"
              style={{ background: 'linear-gradient(135deg, rgba(46,204,113,0.05) 0%, rgba(46,204,113,0.02) 100%)', border: '1px solid rgba(46,204,113,0.3)' }}>
              <span className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: '#2ECC71', color: '#080C10' }}>97% OFF</span>
              <p className="text-xs font-bold uppercase tracking-widest text-lp-green mb-6">● Estudar com Sua Vaga IA</p>
              <div className="space-y-3">
                {['Tudo em um só lugar por R$129/mês', 'Doutrina dos melhores autores brasileiros', 'Legislação verificada em tempo real', 'Cronograma personalizado para sua rotina', 'Nível de preparação dos melhores candidatos'].map(t => (
                  <p key={t} className="flex items-start gap-2 text-sm text-lp-text-secondary">
                    <span className="text-lp-green mt-0.5">✓</span> {t}
                  </p>
                ))}
              </div>
              <div className="mt-6">
                <span className="font-serif text-7xl text-lp-text">R$129</span>
                <span className="text-2xl text-lp-text-muted">/mês</span>
              </div>
              <p className="text-sm text-lp-text-muted mt-1">ou R$1.290 à vista (1 ano)</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <button onClick={() => scrollTo('pricing')}
              className="rounded-full px-10 py-4 text-base font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: '#2ECC71', color: '#080C10', boxShadow: '0 8px 30px rgba(46,204,113,0.3)' }}>
              Começar agora →
            </button>
          </div>
        </div>
      </Section>

      {/* ═══ 9. AREAS ═══ */}
      <Section className="px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-semibold uppercase tracking-widest text-lp-green mb-4">Expansão constante</p>
          <h2 className="font-serif font-normal" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, color: '#F2F4F7' }}>
            23+ concursos. 11 áreas. E crescendo.
          </h2>
          <div className="mt-12 flex flex-wrap gap-3">
            {areas.map(a => (
              <span key={a.name} className="rounded-full px-5 py-2.5 text-sm flex items-center gap-2"
                style={{ background: '#0F1419', border: '1px solid rgba(255,255,255,0.06)', color: '#F2F4F7' }}>
                {a.name} <span className="text-lp-green font-semibold">({a.count})</span>
              </span>
            ))}
            {areasFuture.map(a => (
              <span key={a} className="rounded-full px-5 py-2.5 text-sm flex items-center gap-2 opacity-40"
                style={{ background: '#0F1419', border: '1px solid rgba(255,255,255,0.06)', color: '#F2F4F7' }}>
                {a} <span className="text-xs">Em breve</span>
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 10. PRICING ═══ */}
      <Section id="pricing" className="relative px-4 py-24 md:py-32 scroll-mt-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(46,204,113,0.06) 0%, transparent 70%)' }} />
        <div className="relative z-10 mx-auto max-w-[1100px] text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-lp-green mb-4">Primeiros 1000 usuários</p>
          <h2 className="font-serif font-normal" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, color: '#F2F4F7' }}>
            Sua aprovação começa <em className="text-lp-green">hoje</em>.
          </h2>

          <div className="mx-auto mt-14 max-w-[600px] rounded-3xl p-12" style={{ background: '#0F1419', border: '1px solid rgba(46,204,113,0.3)' }}>
            <div>
              <span className="font-serif" style={{ fontSize: '64px', color: '#F2F4F7' }}>R$129</span>
              <span className="text-[22px] text-lp-text-muted">/mês</span>
            </div>
            <p className="text-sm text-lp-text-muted mt-2">ou R$1.290,00 à vista (1 ano)</p>
            <div className="mt-6 flex justify-center gap-4 text-sm text-lp-text-secondary">
              <span>💳 Cartão de crédito</span>
              <span>💰 PIX</span>
            </div>
            <Link to="/auth/signup" className="block mt-8">
              <button className="w-full rounded-full py-4 text-lg font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: '#2ECC71', color: '#080C10', boxShadow: '0 8px 30px rgba(46,204,113,0.3)' }}>
                Começar agora →
              </button>
            </Link>
            <div className="mt-5 flex justify-center gap-6 text-sm text-lp-text-muted">
              <span>✓ Cancele quando quiser</span>
              <span>✓ Sem taxas escondidas</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 11. URGENCY ═══ */}
      <Section className="px-4 py-24 md:py-32" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-[700px] text-center">
          <h2 className="font-serif font-normal" style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.15, color: '#F2F4F7' }}>
            Cada dia sem estudar direito<br />é um dia mais longe da aprovação.
          </h2>
          <p className="mt-6 text-lp-text-secondary leading-relaxed">
            Enquanto você decide, outros candidatos já estão usando IA para estudar mais rápido, com mais qualidade e por menos dinheiro.
          </p>
          <p className="mt-4 text-lp-text font-semibold">
            A pergunta não é se IA vai mudar os concursos. É se você vai estar na frente ou atrás.
          </p>
          <button onClick={() => scrollTo('pricing')}
            className="mt-10 rounded-full px-10 py-4 text-base font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: '#2ECC71', color: '#080C10', boxShadow: '0 8px 30px rgba(46,204,113,0.3)' }}>
            Começar agora — oferta limitada
          </button>
        </div>
      </Section>

      {/* ═══ 12. FAQ ═══ */}
      <Section className="px-4 py-24 md:py-32">
        <div className="mx-auto max-w-[700px]">
          <p className="text-xs font-semibold uppercase tracking-widest text-lp-green mb-4 text-center">Dúvidas</p>
          <h2 className="font-serif font-normal text-center mb-12" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, color: '#F2F4F7' }}>
            Perguntas frequentes
          </h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl overflow-hidden transition-colors"
                style={{ background: '#0F1419', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left text-lp-text font-medium hover:text-lp-green transition-colors">
                  {f.q}
                  <span className="text-lp-text-muted transition-transform duration-300 ml-4 flex-shrink-0"
                    style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-lp-text-secondary leading-relaxed">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 13. FOOTER ═══ */}
      <footer className="px-4 py-16 pb-10" style={{ background: '#0F1419', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-[1100px] grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: '#2ECC71' }}>
                <span className="text-sm font-bold" style={{ color: '#080C10' }}>✓</span>
              </div>
              <span className="text-lg font-semibold text-lp-text">Sua Vaga <span className="text-lp-green">IA</span></span>
            </div>
            <p className="font-serif italic text-sm text-lp-text-muted">Inteligência que aprova.</p>
          </div>
          <div>
            <p className="text-sm text-lp-text font-medium mb-2">Empresa</p>
            <p className="text-sm text-lp-text-muted leading-relaxed">Sua Vaga Concursos — 2026<br />CNPJ 39.177.511/0001-19</p>
          </div>
          <div>
            <p className="text-sm text-lp-text font-medium mb-2">Endereço</p>
            <p className="text-sm text-lp-text-muted leading-relaxed">Alameda Angelim, 316<br />Vivendas do Arvoredo, Alphaville 2<br />Londrina — PR, CEP 86055-778</p>
          </div>
          <div>
            <p className="text-sm text-lp-text font-medium mb-2">Contato</p>
            <p className="text-sm text-lp-text-muted">contato@suavagaia.com.br</p>
          </div>
        </div>
        <div className="mx-auto max-w-[1100px] mt-10 pt-6 flex flex-wrap items-center justify-center gap-4 text-[13px] text-lp-text-muted" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/privacy" className="hover:text-lp-text transition-colors">Política de Privacidade</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-lp-text transition-colors">Termos de Uso</Link>
          <span>·</span>
          <a href="mailto:contato@suavagaia.com.br" className="hover:text-lp-text transition-colors">Suporte</a>
        </div>
      </footer>
    </div>
  );
}
