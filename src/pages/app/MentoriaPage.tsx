import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Loader2, ArrowRight, ArrowLeft, Brain, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://lxteajwzovoeclbytdrp.supabase.co';
const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface FixedSchedule {
  name: string;
  days: number[];
  start_time: string;
  end_time: string;
}

interface Contest {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  selected: boolean;
  questions_count?: number;
}

interface UsageInfo {
  is_subscriber: boolean;
  limit: number;
  used: number;
  remaining: number;
  can_generate: boolean;
}

export default function MentoriaPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);

  // Usage info
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  // Step 1
  const [wakeUpTimes, setWakeUpTimes] = useState<Record<number, string | 'none'>>({
    0: 'none', 1: '07:00', 2: '07:00', 3: '07:00', 4: '07:00', 5: '07:00', 6: 'none',
  });

  // Step 2
  const [fixedSchedules, setFixedSchedules] = useState<FixedSchedule[]>([]);

  // Step 3
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Fetch usage info
  useEffect(() => {
    if (authLoading) return;

    const fetchUsage = async () => {
      try {
        const storageKey = 'sb-lxteajwzovoeclbytdrp-auth-token';
        const raw = localStorage.getItem(storageKey);
        const accessToken = raw ? JSON.parse(raw)?.access_token : null;

        const res = await fetch(`${SUPABASE_URL}/functions/v1/mentorship-chat`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch (err) {
        console.error('Error fetching usage:', err);
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsage();
  }, [authLoading]);

  useEffect(() => {
    supabase.from('contests').select('id, name').eq('is_active', true).order('name').then(({ data }) => {
      setContests((data as Contest[]) ?? []);
    });
  }, []);

  useEffect(() => {
    if (!selectedContestId) { setSubjects([]); return; }
    supabase.from('subjects').select('id, name').eq('contest_id', selectedContestId).eq('is_active', true).order('name').then(({ data }) => {
      setSubjects((data ?? []).map((s: any) => ({ ...s, selected: true })));
    });
  }, [selectedContestId]);

  const addSchedule = () => {
    setFixedSchedules(prev => [...prev, { name: '', days: [], start_time: '08:00', end_time: '18:00' }]);
  };

  const removeSchedule = (idx: number) => {
    setFixedSchedules(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSchedule = (idx: number, field: keyof FixedSchedule, value: any) => {
    setFixedSchedules(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const toggleScheduleDay = (idx: number, day: number) => {
    setFixedSchedules(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const days = s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day];
      return { ...s, days };
    }));
  };

  const handleGenerate = async () => {
    if (!user) return;
    const selectedSubjects = subjects.filter(s => s.selected).map(s => ({
      name: s.name,
      ...(s.questions_count ? { questions_count: s.questions_count } : {}),
    }));

    if (selectedSubjects.length === 0) {
      toast.error('Selecione pelo menos uma matéria');
      return;
    }

    setGenerating(true);

    try {
      const storageKey = 'sb-lxteajwzovoeclbytdrp-auth-token';
      const raw = localStorage.getItem(storageKey);
      const accessToken = raw ? JSON.parse(raw)?.access_token : null;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/mentorship-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          wake_up_times: wakeUpTimes,
          fixed_schedules: fixedSchedules,
          subjects: selectedSubjects,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.code === 'MENTORIA_LIMIT_REACHED') {
          toast.error(err.error || 'Limite de gerações atingido');
          navigate('/app/upgrade');
          return;
        }
        throw new Error(err.error || `Erro ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success(`Cronograma gerado! ${data.entries_created} sessões de estudo criadas.`);
        navigate('/app/schedule');
      } else {
        throw new Error('Resposta inesperada');
      }
    } catch (err: any) {
      console.error('Error generating schedule:', err);
      toast.error(err.message || 'Erro ao gerar cronograma');
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = usage?.can_generate !== false;

  if (generating) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald" />
          <p className="text-lg font-medium text-foreground">Gerando seu cronograma personalizado...</p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="h-7 w-7 text-emerald" />
          <h1 className="text-2xl font-bold text-foreground">Mentoria de Estudos</h1>
        </div>

        {/* Usage card for free users */}
        {!usageLoading && usage && !usage.is_subscriber && (
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Você usou <span className="font-semibold text-foreground">{usage.used}</span> de <span className="font-semibold text-foreground">{usage.limit}</span> gerações disponíveis no plano gratuito
                </p>
              </div>
              <Progress
                value={(usage.used / usage.limit) * 100}
                className="h-2"
                indicatorClassName={usage.remaining === 0 ? 'bg-destructive' : 'bg-emerald'}
              />
              {usage.remaining === 0 && (
                <div className="flex items-center gap-3 mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">Limite atingido</p>
                    <p className="text-xs text-muted-foreground">Assine para gerar cronogramas ilimitados</p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/app/upgrade')} className="bg-emerald hover:bg-emerald-hover text-primary-foreground">
                    Assinar agora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step indicators */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === s ? 'bg-emerald text-primary-foreground' : step > s ? 'bg-emerald/20 text-emerald' : 'bg-secondary text-muted-foreground'}`}>
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 ${step > s ? 'bg-emerald' : 'bg-border'}`} />}
            </div>
          ))}
          <span className="ml-3 text-sm text-muted-foreground">
            {step === 1 && 'Horários'}
            {step === 2 && 'Compromissos'}
            {step === 3 && 'Matérias'}
          </span>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">Informe a que horas você acorda em cada dia da semana. Desative os dias em que não estuda.</p>
              {DAYS.map((day, idx) => {
                const isOff = wakeUpTimes[idx] === 'none';
                return (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-foreground w-24">{day}</span>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground">Não estudo</Label>
                      <Switch checked={isOff} onCheckedChange={(v) => setWakeUpTimes(prev => ({ ...prev, [idx]: v ? 'none' : '07:00' }))} />
                    </div>
                    {!isOff && (
                      <Input
                        type="time"
                        value={wakeUpTimes[idx] as string}
                        onChange={(e) => setWakeUpTimes(prev => ({ ...prev, [idx]: e.target.value }))}
                        className="w-32 border-border bg-background text-foreground"
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">Adicione seus compromissos fixos (trabalho, faculdade, etc.) para que o cronograma respeite sua rotina.</p>
              {fixedSchedules.map((sched, idx) => (
                <div key={idx} className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Nome do compromisso"
                      value={sched.name}
                      onChange={(e) => updateSchedule(idx, 'name', e.target.value)}
                      className="max-w-[200px] border-border bg-background text-foreground"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeSchedule(idx)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day, dayIdx) => (
                      <label key={dayIdx} className="flex items-center gap-1.5 text-xs">
                        <Checkbox
                          checked={sched.days.includes(dayIdx)}
                          onCheckedChange={() => toggleScheduleDay(idx, dayIdx)}
                        />
                        {day.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Início</Label>
                      <Input type="time" value={sched.start_time} onChange={(e) => updateSchedule(idx, 'start_time', e.target.value)} className="w-28 border-border bg-background text-foreground" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Fim</Label>
                      <Input type="time" value={sched.end_time} onChange={(e) => updateSchedule(idx, 'end_time', e.target.value)} className="w-28 border-border bg-background text-foreground" />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addSchedule} className="gap-2">
                <Plus size={16} /> Adicionar compromisso
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">Selecione o concurso e as matérias que deseja estudar.</p>
              <div>
                <Label className="text-sm text-muted-foreground">Concurso</Label>
                <Select value={selectedContestId} onValueChange={setSelectedContestId}>
                  <SelectTrigger className="mt-1 border-border bg-background text-foreground">
                    <SelectValue placeholder="Selecione um concurso" />
                  </SelectTrigger>
                  <SelectContent>
                    {contests.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {subjects.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Matérias</p>
                  {subjects.map((subj, idx) => (
                    <div key={subj.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={subj.selected}
                          onCheckedChange={(v) => setSubjects(prev => prev.map((s, i) => i === idx ? { ...s, selected: v } : s))}
                        />
                        <span className="text-sm text-foreground">{subj.name}</span>
                      </div>
                      {subj.selected && (
                        <Input
                          type="number"
                          placeholder="Nº questões"
                          value={subj.questions_count ?? ''}
                          onChange={(e) => setSubjects(prev => prev.map((s, i) => i === idx ? { ...s, questions_count: e.target.value ? parseInt(e.target.value) : undefined } : s))}
                          className="w-28 border-border bg-background text-foreground text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2">
              <ArrowLeft size={16} /> Voltar
            </Button>
          ) : <div />}
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} className="bg-emerald hover:bg-emerald-hover text-primary-foreground gap-2">
              Próximo <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="bg-emerald hover:bg-emerald-hover text-primary-foreground gap-2 disabled:opacity-50"
            >
              <Brain size={16} /> Gerar Cronograma
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
