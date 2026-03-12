import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 text-center">
      <Logo size="large" />
      <h1 className="mt-8 max-w-xl font-display text-4xl text-light sm:text-5xl">
        Preparação inteligente para concursos jurídicos
      </h1>
      <p className="mt-4 max-w-md text-muted-light">
        Agentes de IA especializados para acelerar sua aprovação em Magistratura, Ministério Público, Defensoria e mais.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/auth/signup">
          <Button className="bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold px-8" size="lg">
            Começar Gratuitamente
          </Button>
        </Link>
        <Link to="/auth/login">
          <Button variant="outline" className="border-navy-border text-light hover:bg-navy-deep" size="lg">
            Fazer Login
          </Button>
        </Link>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-light">
        <span className="flex items-center gap-1"><CheckCircle size={14} className="text-emerald" /> Conta gratuita disponível</span>
        <span className="flex items-center gap-1"><CheckCircle size={14} className="text-emerald" /> Agentes especializados</span>
        <span className="flex items-center gap-1"><CheckCircle size={14} className="text-emerald" /> Cancele quando quiser</span>
      </div>

      <div className="mt-12 flex gap-4 text-xs text-muted-light">
        <Link to="/terms" className="hover:text-light transition-colors">Termos de Uso</Link>
        <span>·</span>
        <Link to="/privacy" className="hover:text-light transition-colors">Privacidade</Link>
      </div>
    </div>
  );
}
