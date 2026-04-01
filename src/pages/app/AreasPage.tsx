import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Area {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  contest_count?: number;
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAreas = async () => {
      const { data } = await supabase
        .from('areas')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

        setAreas(data || []);
      }
      setLoading(false);
    };
    fetchAreas();
  }, []);

  const handleAreaClick = (area: Area) => {
    localStorage.setItem('selectedArea', JSON.stringify({ id: area.id, name: area.name, slug: area.slug }));
    navigate(`/app/contests/${area.slug}`);
  };

  const getIcon = (iconName: string) => {
    // Try exact match first, then PascalCase conversion for lowercase/kebab names
    const pascalName = iconName
      .split(/[-_\s]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
    const Icon = (LucideIcons as any)[iconName] || (LucideIcons as any)[pascalName] || LucideIcons.BookOpen;
    return Icon;
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-foreground">Escolha sua área de concurso</h1>
        <p className="mt-2 text-muted-foreground">Selecione a área em que você deseja estudar</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
        </div>
      ) : areas.length === 0 ? (
        <div className="py-12 text-center">
          <h2 className="font-display text-xl text-foreground">Nenhuma área disponível</h2>
          <p className="mt-2 text-muted-foreground">Em breve novas áreas serão adicionadas.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => {
            const IconComp = getIcon(area.icon);
            return (
              <button
                key={area.id}
                onClick={() => handleAreaClick(area)}
                className="group flex flex-col items-start rounded-lg border border-border bg-card p-6 text-left transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10">
                  <IconComp className="text-emerald" size={24} />
                </div>
                <h3 className="font-display text-lg text-card-foreground">{area.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{area.description}</p>
                
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald group-hover:underline">
                  Acessar <ArrowRight size={14} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
