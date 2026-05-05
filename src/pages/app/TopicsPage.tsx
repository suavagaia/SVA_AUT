import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export default function TopicsPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const selectedSubject = JSON.parse(localStorage.getItem('selectedSubject') || '{}');
  const selectedContest  = JSON.parse(localStorage.getItem('selectedContest')  || '{}');
  const selectedArea     = JSON.parse(localStorage.getItem('selectedArea')     || '{}');

  useEffect(() => {
    const fetchTopics = async () => {
      const { data } = await supabase
        .from('topics')
        .select('id, name, slug, display_order')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('display_order');

      if (data) setTopics(data);
      setLoading(false);
    };
    fetchTopics();
  }, [subjectId]);

  const handleTopicClick = (topic: Topic) => {
    localStorage.setItem('selectedTopic', JSON.stringify({ id: topic.id, name: topic.name, slug: topic.slug }));
    navigate(`/app/agents/${topic.id}`);
  };

  return (
    <AppLayout>
      <Link
        to={`/app/subjects/${selectedContest.id || ''}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para Cargos
      </Link>

      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">
          {selectedArea.name} → {selectedContest.name}
        </p>
        <h1 className="font-display text-3xl text-foreground">Matérias — {selectedSubject.name || 'Cargo'}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
        </div>
      ) : topics.length === 0 ? (
        <div className="py-12 text-center">
          <h2 className="font-display text-xl text-foreground">Nenhuma matéria disponível</h2>
          <p className="mt-2 text-muted-foreground">Em breve novas matérias serão adicionadas.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleTopicClick(topic)}
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-5 text-left transition-shadow hover:shadow-md"
            >
              <h3 className="font-display text-foreground">{topic.name}</h3>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald group-hover:underline">
                Selecionar <ArrowRight size={14} />
              </span>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
