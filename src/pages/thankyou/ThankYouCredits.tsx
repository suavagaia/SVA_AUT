import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThankYouCredits() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
          <Coins className="text-blue-600" size={40} />
        </div>
        <h1 className="font-display text-3xl text-foreground">Créditos Adicionados!</h1>
        <p className="mt-2 text-muted-foreground">Seu Pacote de Créditos foi ativado com sucesso</p>

        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          ⚡ 600.000 Tokens Adicionados!
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="font-display text-2xl text-foreground">300.000</p>
            <p className="mt-1 text-xs text-muted-foreground">Tokens totais</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="font-display text-2xl text-foreground">300.000</p>
            <p className="mt-1 text-xs text-muted-foreground">Para todos os agentes</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-emerald/5 border border-emerald/20 p-4 text-left text-sm text-emerald">
          <p className="font-medium">💡 Dica de Uso:</p>
          <p className="mt-1">Estes créditos são ideais para sessões intensivas de estudo.</p>
          <p className="mt-2 text-xs">✅ Créditos válidos por 12 meses · Sem taxa de manutenção</p>
        </div>

        <div className="mt-8 space-y-3">
          <Link to="/app/areas" className="block">
            <Button className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold" size="lg">
              Usar Créditos Agora!
            </Button>
          </Link>
          <Button variant="outline" className="w-full" disabled>
            Ver Saldo de Tokens →
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Seus tokens foram creditados automaticamente na sua conta
        </p>
      </div>
    </div>
  );
}
