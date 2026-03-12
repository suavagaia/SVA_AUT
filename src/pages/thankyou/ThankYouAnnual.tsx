import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThankYouAnnual() {
  const renewalDate = new Date();
  renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  const formattedDate = renewalDate.toLocaleDateString('pt-BR');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald/10">
          <CheckCircle className="text-emerald" size={40} />
        </div>
        <h1 className="font-display text-3xl text-foreground">Assinatura Anual Ativada!</h1>
        <p className="mt-2 text-muted-foreground">Parabéns! Você escolheu o Plano Anual do Sua Vaga IA</p>

        <div className="mt-6 rounded-lg bg-emerald/5 border border-emerald/20 p-4 text-sm text-emerald">
          🎁 Você economizou R$258,00! Ao escolher o plano anual, você paga menos por mês
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { title: 'Acesso Ilimitado', desc: 'Todos os agentes' },
            { title: 'IA Avançada', desc: 'Tecnologia avançada' },
            { title: 'Suporte VIP', desc: 'Atendimento prioritário' },
            { title: 'Mentoria Exclusiva', desc: 'Orientação personalizada' },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-card p-4 text-left">
              <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                <CheckCircle size={14} className="text-emerald" /> {item.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          🏆 Sua assinatura anual está ativa até {formattedDate}
        </div>

        <Link to="/app/areas" className="mt-8 block">
          <Button className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold" size="lg">
            Começar a Estudar Agora!
          </Button>
        </Link>
      </div>
    </div>
  );
}
