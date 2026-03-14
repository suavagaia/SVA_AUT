import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Brain, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface ScheduleEntry {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  activity_type: string | null;
}

interface StudySession {
  schedule_entry_id: string;
  duration_minutes: number;
}

interface StatSession {
  activity_name: string;
  duration_minutes: number;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTimeRange(start: string, end: string) {
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`;
}

function ProgressIndicator({ entryId, plannedMinutes, sessions }: { entryId: string; plannedMinutes: number; sessions: StudySession[] }) {
  const studied = sessions.filter(s => s.schedule_entry_id === entryId).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const pct = plannedMinutes > 0 ? Math.min(Math.round((studied / plannedMinutes) * 100), 100) : 0;

  return (
    <div className="space-y-1">
      <Progress value={pct} className="h-2" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{studied}min / {plannedMinutes}min</span>
        {pct >= 100 && <Badge className="bg-emerald/20 text-emerald border-emerald/30 text-xs">Meta cumprida! ✓</Badge>}
        {pct > 0 && pct < 100 && <Badge variant="secondary" className="text-xs">Em progresso {pct}%</Badge>}
      </div>
    </div>
  );
}

function EntryCard({ entry, sessions }: { entry: ScheduleEntry; sessions: StudySession[] }) {
  const plannedMinutes = timeToMinutes(entry.end_time) - timeToMinutes(entry.start_time);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">{entry.subject}</p>
          {entry.activity_type && <p className="text-xs text-muted-foreground">{entry.activity_type}</p>}
        </div>
        <Badge variant="outline" className="text-xs">{formatTimeRange(entry.start_time, entry.end_time)}</Badge>
      </div>
      <ProgressIndicator entryId={entry.id} plannedMinutes={plannedMinutes} sessions={sessions} />
    </div>
  );
}

export default function SchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState<StatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(String(new Date().getDay()));
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [entriesRes, sessionsRes, statsRes] = await Promise.all([
        supabase
          .from('user_schedule_entries')
          .select('id, day_of_week, start_time, end_time, subject, activity_type')
          .eq('user_id', user.id)
          .order('day_of_week')
          .order('start_time'),
        supabase
          .from('study_sessions')
          .select('schedule_entry_id, duration_minutes')
          .eq('user_id', user.id)
          .eq('status', 'concluida')
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase
          .from('study_sessions')
          .select('activity_name, duration_minutes')
          .eq('user_id', user.id)
          .eq('status', 'concluida')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      setEntries((entriesRes.data as ScheduleEntry[]) ?? []);
      setSessions((sessionsRes.data as StudySession[]) ?? []);
      setStats((statsRes.data as StatSession[]) ?? []);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const dailyEntries = entries.filter(e => e.day_of_week === Number(selectedDay));

  const groupedByDay = useMemo(() => {
    const map: Record<number, ScheduleEntry[]> = {};
    entries.forEach(e => {
      if (!map[e.day_of_week]) map[e.day_of_week] = [];
      map[e.day_of_week].push(e);
    });
    return map;
  }, [entries]);

  // Stats calculations
  const totalWeeklyMinutes = stats.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const avgDaily = Math.round(totalWeeklyMinutes / 7);
  const topSubjects = useMemo(() => {
    const map: Record<string, number> = {};
    stats.forEach(s => { map[s.activity_name] = (map[s.activity_name] ?? 0) + (s.duration_minutes ?? 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [stats]);

  // Month calendar
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysWithEntries = new Set(entries.map(e => e.day_of_week));

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CalendarDays size={48} className="text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">
        Você ainda não tem um cronograma. Converse com a Mentoria para criar o seu!
      </p>
      <Button onClick={() => navigate('/app/mentoria')} className="bg-emerald hover:bg-emerald-hover text-primary-foreground gap-2">
        <Brain size={16} /> Ir para Mentoria
      </Button>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Cronograma de Estudos</h1>
          <Button variant="outline" onClick={() => navigate('/app/mentoria')} className="gap-2">
            <Brain size={16} /> Gerar novo cronograma
          </Button>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : (
          <Tabs defaultValue="daily">
            <TabsList>
              <TabsTrigger value="daily">Diário</TabsTrigger>
              <TabsTrigger value="weekly">Semanal</TabsTrigger>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            </TabsList>

            {/* Daily */}
            <TabsContent value="daily" className="space-y-4">
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="w-48 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dailyEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma atividade para este dia.</p>
              ) : (
                <div className="space-y-3">
                  {dailyEntries.map(e => <EntryCard key={e.id} entry={e} sessions={sessions} />)}
                </div>
              )}
            </TabsContent>

            {/* Weekly */}
            <TabsContent value="weekly">
              <div className="grid grid-cols-7 gap-2">
                {DAYS_SHORT.map((d, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-xs font-bold text-center text-muted-foreground">{d}</p>
                    {(groupedByDay[i] ?? []).length === 0 ? (
                      <p className="text-xs text-center text-muted-foreground/50 py-4">—</p>
                    ) : (
                      (groupedByDay[i] ?? []).map(e => (
                        <div key={e.id} className="rounded border border-border bg-card p-2 text-xs space-y-1">
                          <p className="font-medium text-foreground truncate">{e.subject}</p>
                          <p className="text-muted-foreground">{formatTimeRange(e.start_time, e.end_time)}</p>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Monthly */}
            <TabsContent value="monthly" className="space-y-4">
              <div className="grid grid-cols-7 gap-1">
                {DAYS_SHORT.map(d => (
                  <p key={d} className="text-xs font-bold text-center text-muted-foreground p-2">{d}</p>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const date = new Date(today.getFullYear(), today.getMonth(), dayNum);
                  const dow = date.getDay();
                  const hasEntries = daysWithEntries.has(dow);
                  const isToday = dayNum === today.getDate();
                  const isSelected = selectedMonthDay === dayNum;

                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedMonthDay(dayNum)}
                      className={`relative p-2 text-sm rounded text-center transition-colors ${isToday ? 'font-bold text-emerald' : 'text-foreground'} ${isSelected ? 'bg-emerald/20 ring-1 ring-emerald' : 'hover:bg-secondary'}`}
                    >
                      {dayNum}
                      {hasEntries && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-emerald" />}
                    </button>
                  );
                })}
              </div>
              {selectedMonthDay && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Atividades de {DAYS[new Date(today.getFullYear(), today.getMonth(), selectedMonthDay).getDay()]}
                  </p>
                  {entries
                    .filter(e => e.day_of_week === new Date(today.getFullYear(), today.getMonth(), selectedMonthDay).getDay())
                    .map(e => <EntryCard key={e.id} entry={e} sessions={sessions} />)}
                </div>
              )}
            </TabsContent>

            {/* Stats */}
            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Clock size={14} /> Total semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{totalWeeklyMinutes} min</p>
                    <p className="text-xs text-muted-foreground">{Math.floor(totalWeeklyMinutes / 60)}h {totalWeeklyMinutes % 60}min</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp size={14} /> Média diária</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{avgDaily} min</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><BookOpen size={14} /> Matérias estudadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{topSubjects.length}</p>
                  </CardContent>
                </Card>
              </div>
              {topSubjects.length > 0 ? (
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Top matérias (últimos 7 dias)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topSubjects.map(([name, minutes]) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{name}</span>
                        <span className="text-sm font-mono text-muted-foreground">{minutes} min</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma sessão concluída nos últimos 7 dias.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
