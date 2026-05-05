import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  slug: string;
}

export default function SubjectsPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const selectedContest = JSON.parse(localStorage.getItem('selectedContest') || '{}');
  const selectedArea = JSON.parse(localStorage.getItem('selectedArea') || '{}');

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from('subjects')
        .select('id, name, slug')
        .eq('contest_id', contestId)
        .eq('is_active', true)
        .order('display_order');

      if (data) setSubjects(data);
      setLoading(false);
    };
    fetchSubjects();
  }, [contestId]);

  const handleSubjectClick = (subject: Subject) => {
    localStorage.setItem('selectedSubject', JSON.stringify({ id: subject.id, name: subject.name, slug: subject.slug }));
    navigate(`/app/topics/${subject.id}`);
  };

  return (
    <AppLayout>
      <Link
        to={`/app/contests/${selectedArea.slug || ''}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para Concursos
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl text-foreground">Cargos — {selectedContest.name || 'Concurso'}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-12 text-center">
          <h2 className="font-display text-xl text-foreground">Nenhuma matéria disponível</h2>
          <p className="mt-2 text-muted-foreground">Em breve novas matérias serão adicionadas.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSubjectClick(subject)}
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-5 text-left transition-shadow hover:shadow-md"
            >
              <h3 className="font-display text-foreground">{subject.name}</h3>
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
