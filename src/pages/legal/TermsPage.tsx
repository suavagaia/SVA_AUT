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
    title: '4. Pagamento e Assinatura',
    content: 'O plano mensal custa R$129/mês com renovação automática. O plano anual custa R$1.290/ano. O cancelamento pode ser feito a qualquer momento, sem multa, com acesso mantido até o final do período pago.',
  },
  {
    title: '5. Tokens e Consumo',
    content: 'Assinantes recebem 600.000 tokens por mês, renovados a cada ciclo de cobrança. Tokens não utilizados não são acumulados para o mês seguinte. Pacotes avulsos de tokens têm validade de 12 meses.',
  },
  {
    title: '6. Propriedade Intelectual',
    content: 'Todo o conteúdo da plataforma, incluindo textos, algoritmos, interfaces e materiais de estudo, é de propriedade exclusiva do Sua Vaga IA e protegido por leis de propriedade intelectual.',
  },
  {
    title: '7. Limitações de Responsabilidade',
    content: 'O Sua Vaga IA não garante aprovação em concursos públicos. O serviço é fornecido "como está" e não nos responsabilizamos por decisões tomadas com base nas respostas dos agentes de IA.',
  },
  {
    title: '8. Modificações dos Termos',
    content: 'Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na plataforma com pelo menos 30 dias de antecedência.',
  },
  {
    title: '9. Contato',
    content: 'Para dúvidas sobre estes termos, entre em contato pelo e-mail: contato@suavaga.ia',
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
