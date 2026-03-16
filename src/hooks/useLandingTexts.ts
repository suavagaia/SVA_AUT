import { useState, useEffect } from 'react';

export interface LandingTexts {
  nav_cta_button: string;
  hero_badge: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_title_line3: string;
  hero_subtitle: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  hero_social_proof: string;
  features_title: string;
  features_subtitle: string;
  testimonials_title: string;
  pricing_title: string;
  pricing_subtitle: string;
  footer_tagline: string;
  footer_copyright: string;
}

const defaults: LandingTexts = {
  nav_cta_button: 'Criar Conta Gratuita',
  hero_badge: 'Primeira plataforma de IA para concursos',
  hero_title_line1: 'Passe no seu concurso',
  hero_title_line2: 'com',
  hero_title_line3: 'inteligência artificial.',
  hero_subtitle: 'Doutrina, jurisprudência, questões e cronograma personalizado — 8 agentes de IA especializados trabalhando por você por R$129/mês.',
  hero_cta_primary: 'Começar agora →',
  hero_cta_secondary: 'Ver como funciona',
  hero_social_proof: 'Celular, tablet ou PC • Cancele a qualquer momento • Sem multa, sem fidelidade',
  features_title: '8 agentes trabalhando por você.',
  features_subtitle: 'Cada um especializado em uma área dos seus estudos — tudo por R$129/mês.',
  testimonials_title: 'Perguntas frequentes',
  pricing_title: 'Sua aprovação começa hoje.',
  pricing_subtitle: 'Primeiros 1000 usuários',
  footer_tagline: 'Inteligência que aprova.',
  footer_copyright: 'Sua Vaga Concursos — 2026',
};

const ENDPOINT = 'https://lxteajwzovoeclbytdrp.supabase.co/functions/v1/get-landing-texts';

export function useLandingTexts() {
  const [texts, setTexts] = useState<LandingTexts>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(ENDPOINT)
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setTexts(prev => ({ ...prev, ...data }));
      })
      .catch(() => {/* keep defaults */})
      .finally(() => setLoading(false));
  }, []);

  return { texts, loading, defaults };
}
