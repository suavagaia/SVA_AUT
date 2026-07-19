import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';

const sections = [
  {
    title: 'Como funciona a Política de Uso Justo',
    content:
      'O uso de IA é limitado a um valor equivalente a até 25% do valor do seu plano por ciclo, calculado com base no custo de processamento de cada interação. Ao atingir esse limite, o acesso aos agentes é pausado até o início do próximo ciclo, com a opção de compra de créditos adicionais para uso imediato.',
  },
  {
    title: 'Por que um percentual e não um número de interações',
    content:
      'O limite é divulgado como percentual do valor do plano, não como um número fixo de interações, porque o custo real de cada interação varia conforme o agente utilizado (estudo, questões, jurisprudência, etc.). Assim, o limite é justo e proporcional ao que você paga, independentemente de quais agentes você usa mais.',
  },
  {
    title: 'Saldo do ciclo',
    content:
      'O saldo não utilizado não acumula para o ciclo seguinte — o teto é renovado a cada ciclo. Nos planos semestral e anual, o teto de uso é calculado sobre o valor cheio recorrente do plano, garantindo o mesmo limite mensal independentemente da modalidade de pagamento escolhida.',
  },
  {
    title: 'Aplicação',
    content:
      'A Política de Uso Justo se aplica a todos os planos da plataforma, incluindo o Passaporte. Ela existe para manter a plataforma sustentável e o serviço de qualidade para todos os assinantes.',
  },
];

export default function PoliticaUsoJustoPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10">
            <Scale className="text-emerald" size={24} />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">Política de Uso Justo</h1>
            <p className="text-sm text-muted-foreground">Sua Vaga IA</p>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-lg border border-border bg-card p-6">
              <h2 className="font-display text-lg text-card-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
