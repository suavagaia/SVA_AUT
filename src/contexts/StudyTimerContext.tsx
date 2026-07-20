import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type TimerStatus = 'idle' | 'running' | 'paused';

interface ScheduleActivity {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
  activity_type: string | null;
}

interface StudyTimerContextType {
  status: TimerStatus;
  elapsed: number;
  selectedActivity: ScheduleActivity | null;
  todayActivities: ScheduleActivity[];
  loadingActivities: boolean;
  currentSessionId: string | null;
  setSelectedActivity: (a: ScheduleActivity | null) => void;
  fetchTodayActivities: () => Promise<void>;
  start: () => Promise<void>;
  startFree: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
}

const StudyTimerContext = createContext<StudyTimerContextType | null>(null);

export function useStudyTimer() {
  const ctx = useContext(StudyTimerContext);
  if (!ctx) throw new Error('useStudyTimer must be used within StudyTimerProvider');
  return ctx;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function StudyTimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [status, setStatus] = useState<TimerStatus>(() => {
    return (localStorage.getItem('study_timer_status') as TimerStatus) || 'idle';
  });
  const [elapsed, setElapsed] = useState(() => {
    const saved = localStorage.getItem('study_timer_elapsed');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [startedAt, setStartedAt] = useState<number | null>(() => {
    const saved = localStorage.getItem('study_timer_started_at');
    return saved ? parseInt(saved, 10) : null;
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem('study_timer_session_id');
  });
  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | null>(() => {
    const saved = localStorage.getItem('study_timer_activity');
    return saved ? JSON.parse(saved) : null;
  });
  const [todayActivities, setTodayActivities] = useState<ScheduleActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist state
  useEffect(() => {
    localStorage.setItem('study_timer_status', status);
    localStorage.setItem('study_timer_elapsed', String(elapsed));
    if (startedAt) localStorage.setItem('study_timer_started_at', String(startedAt));
    else localStorage.removeItem('study_timer_started_at');
    if (currentSessionId) localStorage.setItem('study_timer_session_id', currentSessionId);
    else localStorage.removeItem('study_timer_session_id');
    if (selectedActivity) localStorage.setItem('study_timer_activity', JSON.stringify(selectedActivity));
    else localStorage.removeItem('study_timer_activity');
  }, [status, elapsed, startedAt, currentSessionId, selectedActivity]);

  // Tick
  useEffect(() => {
    if (status === 'running' && startedAt) {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status, startedAt]);

  const fetchTodayActivities = useCallback(async () => {
    if (!user) return;
    setLoadingActivities(true);
    const todayDow = new Date().getDay();
    const { data } = await supabase
      .from('user_schedule_entries')
      .select('id, subject, start_time, end_time, activity_type')
      .eq('user_id', user.id)
      .eq('day_of_week', todayDow)
      .order('start_time');
    setTodayActivities((data as ScheduleActivity[]) ?? []);
    setLoadingActivities(false);
  }, [user]);

  const beginSession = useCallback(async (entryId: string | null, name: string) => {
    if (!user) return;
    const { data: session, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: user.id,
        schedule_entry_id: entryId,
        activity_name: name,
        day_of_week: new Date().getDay(),
        start_time: new Date().toISOString(),
        status: 'em_progresso',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating study session:', error);
      toast.error('Erro ao iniciar sessão');
      return;
    }

    setCurrentSessionId(session.id);
    const now = Date.now();
    setStartedAt(now);
    setElapsed(0);
    setStatus('running');
  }, [user]);

  const start = useCallback(async () => {
    if (!selectedActivity) return;
    await beginSession(selectedActivity.id, selectedActivity.subject);
  }, [selectedActivity, beginSession]);

  // Estudo livre: cronômetro sem atividade agendada (sempre disponível).
  const startFree = useCallback(async () => {
    setSelectedActivity({ id: '__free__', subject: 'Estudo livre', start_time: '', end_time: '', activity_type: 'livre' });
    await beginSession(null, 'Estudo livre');
  }, [beginSession]);

  const pause = useCallback(async () => {
    setStatus('paused');
    setStartedAt(null);
    if (currentSessionId) {
      await supabase.from('study_sessions').update({ status: 'pausada' }).eq('id', currentSessionId);
    }
  }, [currentSessionId]);

  const resume = useCallback(async () => {
    const now = Date.now() - elapsed * 1000;
    setStartedAt(now);
    setStatus('running');
    if (currentSessionId) {
      await supabase.from('study_sessions').update({ status: 'em_progresso' }).eq('id', currentSessionId);
    }
  }, [elapsed, currentSessionId]);

  const stop = useCallback(async () => {
    const finalElapsed = elapsed;
    setStatus('idle');
    setElapsed(0);
    setStartedAt(null);

    if (currentSessionId && finalElapsed > 0) {
      const durationMinutes = Math.floor(finalElapsed / 60);
      const { error } = await supabase
        .from('study_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: durationMinutes,
          status: 'concluida',
        })
        .eq('id', currentSessionId);

      if (error) {
        console.error('Error saving study session:', error);
        toast.error('Erro ao salvar sessão de estudo');
      } else {
        toast.success(`Sessão de ${formatTime(finalElapsed)} registrada!`);
      }
    }

    setCurrentSessionId(null);
    setSelectedActivity(null);
  }, [elapsed, currentSessionId]);

  return (
    <StudyTimerContext.Provider value={{
      status, elapsed, selectedActivity, todayActivities, loadingActivities, currentSessionId,
      setSelectedActivity, fetchTodayActivities, start, startFree, pause, resume, stop,
    }}>
      {children}
    </StudyTimerContext.Provider>
  );
}
