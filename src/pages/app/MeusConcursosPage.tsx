import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Lock, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Contest { id: string; name: string; }

const MAX = 5;

export default function MeusConcursosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scope, setScope] = useState<string | null>(null);
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: u }, { data: uc }, { data: all }] = await Promise.all([
        supabase.from('users').select('plan_scope, contests_locked_at').eq('id', user.id).single(),
        supabase.from('user_contests').select('contest_id').eq('user_id', user.id),
        supabase.from('contests').select('id, name').eq('is_active', true).order('display_order').order('name'),
      ]);
      setScope(u?.plan_scope ?? null);
      setLockedAt(u?.contests_locked_at ?? null);
      const cur = (uc ?? []).map((r: { contest_id: string }) => r.contest_id);
      setCurrent(cur);
      setSelected(new Set(cur));
      setContests((all as Contest[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= MAX) { toast.error(`Você pode escolher no máximo ${MAX} concursos.`); return prev; }
        next.add(id);
      }
      return next;
    });
  };

  const confirmar = async () => {
    if (selected.size === 0) { toast.error('Selecione ao menos 1 concurso.'); return; }
    setSaving(true);
    const { error } = await supabase.rpc('set_user_contests', { p_contest_ids: Array.from(selected) });
    setSaving(false);
    if (error) {
      const msg = error.message?.includes('contests_locked')
        ? 'Seus concursos já foram escolhidos neste ciclo. A troca só é possível na renovação.'
        : 'Não foi possível salvar. Tente novamente.';
      toast.error(msg);
      return;
    }
    toast.success('Concursos definidos!');
    navigate('/app/areas');
  };

  if (loading) {
    return <AppLayout><div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" /></div></AppLayout>;
  }

  // Só o Multiconcurso usa esta tela.
  if (scope !== 'multi') {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto text-center py-16 space-y-4">
          <h1 className="font-display text-2xl text-foreground">Seleção de concursos</h1>
          <p className="text-muted-foreground text-sm">
            Esta tela é exclusiva do plano <strong>Multiconcurso</strong>.
          </p>
          <Button onClick={() => navigate('/app/areas')} className="bg-emerald text-primary-foreground">Ir para a plataforma</Button>
        </div>
      </AppLayout>
    );
  }

  // Já escolheu neste ciclo → só leitura.
  if (lockedAt) {
    const chosen = contests.filter((c) => current.includes(c.id));
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-emerald" />
            <h1 className="font-display text-2xl text-foreground">Seus concursos deste ciclo</h1>
          </div>
          <Card className="bg-card border-border p-5 space-y-3">
            {chosen.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald" />
                <span className="text-sm text-card-foreground">{c.name}</span>
              </div>
            ))}
          </Card>
          <p className="flex gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            Você acessa livremente estes concursos durante todo o ciclo. A troca por outros só é possível na renovação da assinatura.
          </p>
          <Button onClick={() => navigate('/app/areas')} className="bg-emerald text-primary-foreground">Ir para a plataforma</Button>
        </div>
      </AppLayout>
    );
  }

  // Escolha inicial.
  const filtered = contests.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-8 space-y-5">
        <div className="space-y-1">
          <h1 className="font-display text-2xl text-foreground">Escolha até {MAX} concursos</h1>
          <p className="text-sm text-muted-foreground">{selected.size} de {MAX} selecionados</p>
        </div>

        <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <span>Você poderá acessar livremente estes {MAX} concursos durante todo o seu ciclo de assinatura. A troca por outros concursos só é possível na renovação.</span>
        </div>

        <Input placeholder="Buscar concurso..." value={query} onChange={(e) => setQuery(e.target.value)} />

        <Card className="bg-card border-border divide-y divide-border max-h-[45vh] overflow-y-auto">
          {filtered.map((c) => {
            const checked = selected.has(c.id);
            return (
              <label key={c.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40">
                <Checkbox checked={checked} onCheckedChange={() => toggle(c.id)} />
                <span className="text-sm text-card-foreground">{c.name}</span>
              </label>
            );
          })}
          {filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum concurso encontrado.</p>}
        </Card>

        <Button onClick={confirmar} disabled={saving || selected.size === 0} className="w-full bg-emerald hover:bg-emerald/90 text-primary-foreground">
          {saving ? 'Salvando...' : `Confirmar ${selected.size} concurso${selected.size === 1 ? '' : 's'}`}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">Após confirmar, a seleção fica fixa até a renovação do ciclo.</p>
      </div>
    </AppLayout>
  );
}
