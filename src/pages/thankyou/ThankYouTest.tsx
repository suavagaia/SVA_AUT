import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThankYouTest() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald/10">
          <CheckCircle className="text-emerald" size={40} />
        </div>
        <h1 className="font-display text-3xl text-emerald">Conta Gratuita Ativada!</h1>
        <p className="mt-2 text-muted-foreground">Bem-vindo à Conta Gratuita do Sua Vaga IA</p>

        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          ✅ Conta Gratuita Permanente: Acesso ao agente de Mentoria sem prazo de expiração.
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 text-left">
            <p className="flex items-center gap-1 text-sm font-medium text-foreground">
              <CheckCircle size={14} className="text-emerald" /> 2 Créditos de Mentoria
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Crie cronogramas de estudo</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-left">
            <p className="flex items-center gap-1 text-sm font-medium text-foreground">
              <CheckCircle size={14} className="text-emerald" /> Acesso Permanente
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Sem prazo de expiração</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          💡 Quer mais? Para acesso aos agentes de estudo e 600k tokens, faça upgrade para um plano pago.
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Créditos de Mentoria Incluídos:</span>
            <span className="font-medium text-foreground">2 créditos</span>
          </div>
        </div>

        <Link to="/auth/login" className="mt-8 block">
          <Button className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold" size="lg">
            Fazer Login para Começar!
          </Button>
        </Link>

        <Link to="/app/upgrade" className="mt-3 block text-sm text-muted-foreground hover:text-foreground transition-colors">
          Conhecer planos pagos e benefícios permanentes
        </Link>
      </div>
    </div>
  );
}
