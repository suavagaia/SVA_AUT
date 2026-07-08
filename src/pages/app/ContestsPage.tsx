import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Contest {
  id: string;
  name: string;
  slug: string;
}

export default function ContestsPage() {
  const { areaSlug } = useParams<{ areaSlug: string }>();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const selectedArea = JSON.parse(localStorage.getItem('selectedArea') || '{}');

  useEffect(() => {
    // Espera o perfil carregar antes de aplicar o filtro do plano — evita mostrar
    // todos os concursos por um instante para quem é do plano SINGLE.
    if (user && !profile) return;

    let ignore = false;
    const fetchContests = async () => {
      setLoading(true);
      // First get area by slug
      const { data: area } = await supabase
        .from('areas')
        .select('id, name, slug')
        .eq('slug', areaSlug)
        .single();

      if (!area) {
        if (!ignore) setLoading(false);
        return;
      }

      if (!selectedArea.id) {
        localStorage.setItem('selectedArea', JSON.stringify({ id: area.id, name: area.name, slug: area.slug }));
      }

      let query = supabase
        .from('contests')
        .select('id, name, slug')
        .eq('area_id', area.id)
        .eq('is_active', true)
        .order('display_order');

      // Plano SINGLE: mostra apenas o concurso contratado
      if (profile?.contest_id) query = query.eq('id', profile.contest_id);

      const { data } = await query;

      if (!ignore) {
        if (data) setContests(data);
        setLoading(false);
      }
    };
    fetchContests();
    return () => { ignore = true; };
  }, [areaSlug, user, profile]);

  const handleContestClick = (contest: Contest) => {
    localStorage.setItem('selectedContest', JSON.stringify({ id: contest.id, name: contest.name, slug: contest.slug }));
    navigate(`/app/subjects/${contest.id}`);
  };

  return (
    <AppLayout>
      <Link to="/app/areas" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Voltar para Áreas
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl text-foreground">Concursos — {selectedArea.name || 'Área'}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
        </div>
      ) : contests.length === 0 ? (
        <div className="py-12 text-center">
          <h2 className="font-display text-xl text-foreground">Nenhum concurso disponível</h2>
          <p className="mt-2 text-muted-foreground">Em breve novos concursos serão adicionados.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contests.map((contest) => (
            <button
              key={contest.id}
              onClick={() => handleContestClick(contest)}
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-5 text-left transition-shadow hover:shadow-md"
            >
              <h3 className="font-display text-foreground">{contest.name}</h3>
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
