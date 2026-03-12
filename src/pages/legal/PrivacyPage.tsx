import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const sections = [
  {
    title: '1. Informações que Coletamos',
    content: 'Coletamos informações fornecidas diretamente por você (nome, e-mail, dados de pagamento) e informações coletadas automaticamente (logs de acesso, endereço IP, dados de uso da plataforma).',
  },
  {
    title: '2. Como Usamos Suas Informações',
    content: 'Utilizamos seus dados para fornecer e melhorar o serviço, processar pagamentos, enviar comunicações relevantes, personalizar sua experiência de estudo e garantir a segurança da plataforma.',
  },
  {
    title: '3. Proteção de Dados',
    content: 'Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito e em repouso, controle de acesso restrito e monitoramento contínuo.',
  },
  {
    title: '4. Compartilhamento de Informações',
    content: 'Não vendemos seus dados. Compartilhamos informações apenas com processadores de pagamento (Stripe) e provedores de infraestrutura essenciais para o funcionamento do serviço.',
  },
  {
    title: '5. Cookies e Tecnologias Similares',
    content: 'Utilizamos cookies essenciais para o funcionamento da plataforma e cookies analíticos para entender como o serviço é utilizado. Você pode gerenciar suas preferências de cookies nas configurações do navegador.',
  },
  {
    title: '6. Seus Direitos (LGPD)',
    content: 'De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a: acessar seus dados, corrigir informações incorretas, solicitar exclusão, portabilidade de dados e revogar consentimento.',
  },
  {
    title: '7. Retenção de Dados',
    content: 'Mantemos seus dados enquanto sua conta estiver ativa. Após encerramento, seus dados são retidos por até 5 anos para cumprimento de obrigações legais, sendo então permanentemente excluídos.',
  },
  {
    title: '8. Menores de Idade',
    content: 'O Sua Vaga IA não é destinado a menores de 18 anos. Não coletamos intencionalmente dados de menores de idade.',
  },
  {
    title: '9. Alterações na Política',
    content: 'Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por e-mail ou através de aviso na plataforma.',
  },
  {
    title: '10. Contato e Encarregado de Dados',
    content: 'Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato com nosso Encarregado de Dados pelo e-mail: privacidade@suavaga.ia',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10">
            <Shield className="text-emerald" size={24} />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">Política de Privacidade</h1>
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
