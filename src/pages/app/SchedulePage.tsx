import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, CheckCircle2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleEntry {
  id: string;
  scheduled_date: string;
  duration_minutes: number;
  status: string;
  subjects: { name: string; contests: { name: string } | null } | null;
}

function getStatusBadge(status: string, date: string) {
  if (status === 'completed') {
    return <Badge className="bg-emerald/20 text-emerald border-emerald/30">Concluído</Badge>;
  }
  const isOverdue = new Date(date) < new Date(new Date().toDateString());
  if (isOverdue) {
    return <Badge variant="destructive">Atrasado</Badge>;
  }
  return <Badge variant="secondary">Pendente</Badge>;
}

function isToday(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

function isThisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function EntryCard({ entry, onComplete }: { entry: ScheduleEntry; onComplete: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{entry.subjects?.name ?? 'Matéria'}</p>
        {entry.subjects?.contests?.name && (
          <p className="text-xs text-muted-foreground">{entry.subjects.contests.name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {new Date(entry.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR')} · {entry.duration_minutes} min
        </p>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(entry.status, entry.scheduled_date)}
        {entry.status !== 'completed' && (
          <Button size="sm" variant="ghost" onClick={() => onComplete(entry.id)} title="Marcar como concluído">
            <CheckCircle2 size={18} className="text-emerald" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_schedule_entries')
      .select('id, scheduled_date, duration_minutes, status, subjects(name, contests(name))')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true });
    if (error) console.error('Error fetching schedule:', error);
    setEntries((data as unknown as ScheduleEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const handleComplete = async (id: string) => {
    const { error } = await supabase
      .from('user_schedule_entries')
      .update({ status: 'completed' })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar entrada');
    } else {
      toast.success('Entrada marcada como concluída!');
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'completed' } : e));
    }
  };

  const todayEntries = entries.filter(e => isToday(e.scheduled_date));
  const weekEntries = entries.filter(e => isThisWeek(e.scheduled_date));
  const monthEntries = entries.filter(e => isThisMonth(e.scheduled_date));

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CalendarDays size={48} className="text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">
        Nenhuma entrada no cronograma. Converse com o agente de Mentoria para gerar seu cronograma personalizado.
      </p>
      <Button onClick={() => navigate('/app/areas')} className="bg-emerald hover:bg-emerald-hover text-primary-foreground gap-2">
        <MessageSquare size={16} /> Ir para Mentoria
      </Button>
    </div>
  );

  const renderList = (list: ScheduleEntry[]) =>
    list.length === 0 ? <EmptyState /> : (
      <div className="space-y-3">
        {list.map(e => <EntryCard key={e.id} entry={e} onComplete={handleComplete} />)}
      </div>
    );

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Cronograma de Estudos</h1>
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : (
          <Tabs defaultValue="today">
            <TabsList>
              <TabsTrigger value="today">Hoje ({todayEntries.length})</TabsTrigger>
              <TabsTrigger value="week">Semana ({weekEntries.length})</TabsTrigger>
              <TabsTrigger value="month">Mês ({monthEntries.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="today">{renderList(todayEntries)}</TabsContent>
            <TabsContent value="week">{renderList(weekEntries)}</TabsContent>
            <TabsContent value="month">{renderList(monthEntries)}</TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
