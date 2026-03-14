import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Brain, CalendarDays, Timer, Volume2, Mic, BarChart3, CheckCircle, ChevronRight, Mail } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useEffect, useState } from 'react';

const features = [
  { icon: Brain, title: 'Agentes Especializados', desc: '26 agentes de IA treinados em cada matéria jurídica — de Direito Constitucional a Direito Processual Civil' },
  { icon: CalendarDays, title: 'Cronograma Personalizado', desc: 'Mentor de IA cria seu plano de estudos semanal respeitando seus horários e compromissos' },
  { icon: Timer, title: 'Cronômetro de Estudos', desc: 'Acompanhe seu tempo real de estudo por matéria e veja seu progresso diariamente' },
  { icon: Volume2, title: 'Estude com Áudio', desc: 'Ouça as respostas dos agentes enquanto faz outras atividades com TTS em velocidade ajustável' },
  { icon: Mic, title: 'Voz para Texto', desc: 'Faça perguntas por voz — transcrição automática para manter o ritmo de estudo' },
  { icon: BarChart3, title: 'Histórico Completo', desc: 'Revise todas as conversas anteriores com filtros por matéria, concurso e período' },
];

const steps = [
  { n: '01', title: 'Escolha seu concurso', desc: 'Selecione entre Magistratura, Ministério Público, Defensoria e outros concursos jurídicos' },
  { n: '02', title: 'Converse com os agentes', desc: 'Tire dúvidas, resolva questões e aprofunde seu conhecimento com agentes especializados por matéria' },
  { n: '03', title: 'Acompanhe seu progresso', desc: 'Visualize seu cronograma, tempo de estudo e evolução em cada disciplina' },
];

const faqs = [
  { q: 'Posso cancelar quando quiser?', a: 'Sim, você pode cancelar sua assinatura a qualquer momento pelo portal de assinante sem taxa de cancelamento.' },
  { q: 'O que são os 600.000 tokens?', a: 'Tokens são a unidade de medida das respostas dos agentes. 600.000 tokens equivalem a aproximadamente 800 respostas completas por mês.' },
  { q: 'Posso usar no celular?', a: 'Sim, a plataforma é totalmente responsiva e funciona em qualquer dispositivo com navegador.' },
  { q: 'Os agentes são atualizados?', a: 'Sim, os prompts e bases de conhecimento dos agentes são atualizados regularmente.' },
  { q: 'Como funciona o plano gratuito?', a: 'No plano gratuito você tem acesso ao agente de Mentoria para criar seu cronograma de estudos personalizado.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-navy-deep font-body text-light">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-navy-deep/90 backdrop-blur-md border-b border-navy-border' : ''}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo size="default" />
          <div className="flex items-center gap-3">
            <Link to="/auth/login">
              <Button variant="outline" size="sm" className="border-navy-border text-light hover:bg-navy">Entrar</Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm" className="bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center"
        style={{ background: 'linear-gradient(180deg, hsl(var(--navy-deep)) 0%, hsl(var(--navy)) 100%)' }}>
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-navy-border bg-navy/50 px-4 py-1.5 text-sm text-muted-light">
          🏆 Preparação para Concursos Jurídicos
        </span>
        <h1 className="max-w-3xl font-display text-4xl leading-tight text-light sm:text-5xl lg:text-6xl">
          Prepare-se para o concurso com um <span className="text-emerald">mentor de IA</span> especializado
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-light">
          26 agentes especializados em Direito, cronograma personalizado e acompanhamento inteligente do seu progresso.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/auth/signup">
            <Button size="lg" className="bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold px-8 text-base">
              Começar gratuitamente <ChevronRight className="ml-1" size={18} />
            </Button>
          </Link>
          <a href="#precos">
            <Button size="lg" variant="outline" className="border-navy-border text-light hover:bg-navy px-8 text-base">
              Ver planos
            </Button>
          </a>
        </div>
        <p className="mt-8 flex items-center gap-2 text-sm text-muted-light">
          <CheckCircle size={14} className="text-emerald" /> Junte-se a centenas de candidatos aprovados
        </p>
      </section>

      {/* Features */}
      <section className="px-4 py-24 sm:px-6" style={{ background: 'hsl(var(--navy))' }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl text-light sm:text-4xl">Tudo que você precisa para ser aprovado</h2>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-navy-border bg-navy-deep/60 p-6 transition-colors hover:border-emerald/30">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald/10">
                  <f.icon size={24} className="text-emerald" />
                </div>
                <h3 className="font-display text-xl text-light">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-24 sm:px-6" style={{ background: 'hsl(var(--navy-deep))' }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl text-light sm:text-4xl">Como funciona</h2>
          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <span className="font-display text-5xl text-emerald/20">{s.n}</span>
                <h3 className="mt-2 font-display text-xl text-light">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="scroll-mt-20 px-4 py-24 sm:px-6" style={{ background: 'hsl(var(--navy))' }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-3xl text-light sm:text-4xl">Planos e preços</h2>
          <p className="mt-3 text-center text-muted-light">Comece gratuitamente e assine quando quiser</p>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {/* Free */}
            <div className="rounded-xl border border-navy-border bg-navy-deep/60 p-6 flex flex-col">
              <h3 className="font-display text-xl text-light">Gratuito</h3>
              <p className="mt-4 font-display text-4xl text-light">R$0</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-light">
                <li className="flex items-start gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald" />Acesso ao agente de Mentoria</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald" />Geração de cronograma personalizado</li>
              </ul>
              <Link to="/auth/signup" className="mt-8">
                <Button variant="outline" className="w-full border-navy-border text-light hover:bg-navy">Criar conta grátis</Button>
              </Link>
            </div>

            {/* Monthly */}
            <div className="relative rounded-xl border-2 border-emerald bg-navy-deep/60 p-6 flex flex-col">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald px-3 py-0.5 text-xs font-semibold text-primary-foreground">Mais popular</span>
              <h3 className="font-display text-xl text-light">Mensal</h3>
              <p className="mt-4 font-display text-4xl text-light">R$129<span className="text-lg text-muted-light">/mês</span></p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-light">
                <li className="flex items-start gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald" />Todos os 26 agentes especializados</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald" />600.000 tokens por mês</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald" />Cronograma + cronômetro + histórico</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald" />TTS + STT</li>
              </ul>
              <Link to="/auth/signup" className="mt-8">
                <Button className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold">Assinar agora</Button>
              </Link>
            </div>

            {/* Annual */}
            <div className="relative rounded-xl border border-navy-border bg-navy-deep/60 p-6 flex flex-col">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-navy border border-emerald/50 px-3 py-0.5 text-xs font-semibold text-emerald">Melhor custo-benefício</span>
              <h3 className="font-display text-xl text-light">Anual</h3>
              <p className="mt-4 font-display text-4xl text-light">R$1.290<span className="text-lg text-muted-light">/ano</span></p>
              <p className="text-sm text-emerald">~R$107,50/mês</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-light">
                <li className="flex items-start gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald" />Tudo do plano Mensal</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald" />Economia de R$258 por ano</li>
              </ul>
              <Link to="/auth/signup" className="mt-8">
                <Button variant="outline" className="w-full border-emerald text-emerald hover:bg-emerald/10">Assinar anual</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-24 sm:px-6" style={{ background: 'hsl(var(--navy-deep))' }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-display text-3xl text-light sm:text-4xl">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="mt-12">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-navy-border">
                <AccordionTrigger className="text-left text-light hover:text-emerald hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-light">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 py-24 sm:px-6" style={{ background: 'linear-gradient(135deg, hsl(160 59% 25%) 0%, hsl(160 59% 18%) 100%)' }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl text-light sm:text-4xl">Comece sua preparação hoje</h2>
          <p className="mt-4 text-lg text-light/80">Crie sua conta gratuitamente e gere seu cronograma personalizado em minutos.</p>
          <Link to="/auth/signup" className="mt-8 inline-block">
            <Button size="lg" className="bg-white text-navy-deep hover:bg-white/90 font-semibold px-10 text-base">
              Criar conta grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-border px-4 py-10 sm:px-6" style={{ background: 'hsl(var(--navy-deep))' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Logo size="default" />
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-light">
            <Link to="/terms" className="hover:text-light transition-colors">Termos de Uso</Link>
            <span className="hidden sm:inline">·</span>
            <Link to="/privacy" className="hover:text-light transition-colors">Política de Privacidade</Link>
            <span className="hidden sm:inline">·</span>
            <a href="mailto:suporte@suavagaia.com.br" className="flex items-center gap-1 hover:text-light transition-colors">
              <Mail size={14} /> suporte@suavagaia.com.br
            </a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-light/60">© 2026 Sua Vaga IA. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
