import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Agent {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  tool_file_search?: boolean;
}

export default function AgentsPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const selectedSubject = JSON.parse(localStorage.getItem('selectedSubject') || '{}');
  const selectedContest = JSON.parse(localStorage.getItem('selectedContest') || '{}');

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase
        .from('agent_subjects')
        .select('agents:agent_id(id, title, slug, description, icon, is_active, display_order, tool_file_search)')
        .eq('subject_id', subjectId);

      if (data) {
        const parsed = data
          .map((row: any) => row.agents)
          .filter((a: any) => a && a.is_active)
          .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
        setAgents(parsed);
      }
      setLoading(false);
    };
    fetchAgents();
  }, [subjectId]);

  const handleAgentClick = (agent: Agent) => {
    const isFreeUser = profile?.role === 'free_user';
    const isMentoria = agent.slug === 'mentoria';

    if (isFreeUser && !isMentoria) {
      navigate('/app/upgrade');
      return;
    }

    localStorage.setItem('selectedAgent', JSON.stringify({
      id: agent.id,
      name: agent.title,
      slug: agent.slug,
      description: agent.description,
      icon: agent.icon,
      tool_file_search: agent.tool_file_search ?? false,
    }));
    navigate('/app/chat');
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Bot;
    return Icon;
  };

  return (
    <AppLayout>
      <Link
        to={`/app/subjects/${selectedContest.id || ''}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para Matérias
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl text-foreground">Agentes — {selectedSubject.name || 'Matéria'}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
        </div>
      ) : agents.length === 0 ? (
        <div className="py-12 text-center">
          <h2 className="font-display text-xl text-foreground">Nenhum agente disponível</h2>
          <p className="mt-2 text-muted-foreground">Em breve novos agentes serão adicionados.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const IconComp = getIcon(agent.icon);
            return (
              <div
                key={agent.id}
                className="flex flex-col rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10">
                  <IconComp className="text-emerald" size={24} />
                </div>
                <h3 className="font-display text-lg text-card-foreground">{agent.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{agent.description}</p>
                <Button
                  onClick={() => handleAgentClick(agent)}
                  className="mt-4 bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold"
                  size="sm"
                >
                  Iniciar <ArrowRight size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
