import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';

const sections = [
  {
    title: '1. Aceitação dos Termos',
    content: 'Ao acessar e utilizar a plataforma Sua Vaga IA, você concorda com estes Termos de Uso. Caso não concorde com alguma disposição, solicitamos que não utilize o serviço.',
  },
  {
    title: '2. Descrição do Serviço',
    content: 'O Sua Vaga IA é uma plataforma de preparação para concursos jurídicos públicos que utiliza agentes de inteligência artificial especializados para auxiliar no estudo de diversas matérias do Direito.',
  },
  {
    title: '3. Conta e Responsabilidades do Usuário',
    content: 'Você é responsável por manter a confidencialidade de suas credenciais de acesso. Todas as atividades realizadas em sua conta são de sua responsabilidade. Notifique-nos imediatamente sobre qualquer uso não autorizado.',
  },
  {
    title: '4. Planos, Pagamento e Cobrança Recorrente',
    content: 'A plataforma oferece três planos: Foco (1 concurso), Multiconcurso (até 5 concursos) e Passaporte (todos os concursos). Cada plano pode ser contratado nas modalidades mensal, semestral (20% de desconto) ou anual (30% de desconto). O plano Foco custa R$ 19,90 no 1º mês e passa a R$ 69,90/mês a partir do 2º mês. Todas as assinaturas são cobradas de forma recorrente e automática no meio de pagamento cadastrado, na periodicidade escolhida, até que o usuário cancele na área "Minha Assinatura".',
  },
  {
    title: '5. Política de Uso Justo',
    content: 'O uso de IA é limitado a um valor equivalente a até 25% do valor do plano por ciclo, calculado com base no custo de processamento de cada interação. Ao atingir esse limite, o acesso aos agentes é pausado até o início do próximo ciclo, com a opção de compra de créditos adicionais para uso imediato. O saldo não utilizado não é acumulado para o ciclo seguinte. A política se aplica a todos os planos.',
  },
  {
    title: '6. Direito de Arrependimento',
    content: 'Nos termos do art. 49 do Código de Defesa do Consumidor, você tem até 7 (sete) dias corridos, contados da contratação, para desistir da assinatura e solicitar o reembolso integral do valor pago, sem qualquer dedução, mesmo que já tenha utilizado a plataforma. Basta solicitar pela própria plataforma ou pelo e-mail de suporte. Processado o reembolso, o acesso é encerrado e as cobranças futuras, canceladas.',
  },
  {
    title: '7. Cancelamento e Reembolso',
    content: 'Você pode cancelar a qualquer momento, sem multa. O cancelamento interrompe as cobranças futuras, e o acesso permanece ativo até o fim do ciclo já pago. Fora do prazo de arrependimento de 7 dias, não há devolução proporcional do valor já pago referente ao ciclo em curso — regra que vale igualmente para todos os planos e modalidades (mensal, semestral e anual).',
  },
  {
    title: '8. Propriedade Intelectual',
    content: 'Todo o conteúdo da plataforma, incluindo textos, algoritmos, interfaces e materiais de estudo, é de propriedade exclusiva do Sua Vaga IA e protegido por leis de propriedade intelectual.',
  },
  {
    title: '9. Limitações de Responsabilidade',
    content: 'O Sua Vaga IA não garante aprovação em concursos públicos. O serviço é fornecido "como está" e não nos responsabilizamos por decisões tomadas com base nas respostas dos agentes de IA.',
  },
  {
    title: '10. Modificações dos Termos',
    content: 'Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na plataforma com pelo menos 30 dias de antecedência.',
  },
  {
    title: '11. Contato',
    content: 'Para dúvidas sobre estes termos, entre em contato pelo e-mail: suporte@suavagaia.com.br',
  },
];

export default function TermsPage() {
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
            <h1 className="font-display text-3xl text-foreground">Termos de Uso</h1>
            <p className="text-sm text-muted-foreground">Última atualização: 12/03/2026</p>
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
