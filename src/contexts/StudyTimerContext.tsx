import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type TimerStatus = 'idle' | 'running' | 'paused';

interface StudyTimerContextType {
  status: TimerStatus;
  elapsed: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
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
    const saved = localStorage.getItem('study_timer_status');
    return (saved as TimerStatus) || 'idle';
  });
  const [elapsed, setElapsed] = useState(() => {
    const saved = localStorage.getItem('study_timer_elapsed');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [startedAt, setStartedAt] = useState<number | null>(() => {
    const saved = localStorage.getItem('study_timer_started_at');
    return saved ? parseInt(saved, 10) : null;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist state
  useEffect(() => {
    localStorage.setItem('study_timer_status', status);
    localStorage.setItem('study_timer_elapsed', String(elapsed));
    if (startedAt) localStorage.setItem('study_timer_started_at', String(startedAt));
    else localStorage.removeItem('study_timer_started_at');
  }, [status, elapsed, startedAt]);

  // Tick
  useEffect(() => {
    if (status === 'running' && startedAt) {
      // Recover elapsed on mount
      const now = Date.now();
      const recoveredElapsed = Math.floor((now - startedAt) / 1000);
      setElapsed(recoveredElapsed);

      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, startedAt]);

  const start = useCallback(() => {
    const now = Date.now();
    setStartedAt(now);
    setElapsed(0);
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    setStatus('paused');
    // Store accumulated elapsed, clear startedAt
    setStartedAt(null);
  }, []);

  const resume = useCallback(() => {
    // Set new startedAt offset by already elapsed time
    const now = Date.now() - elapsed * 1000;
    setStartedAt(now);
    setStatus('running');
  }, [elapsed]);

  const stop = useCallback(async () => {
    const finalElapsed = elapsed;
    setStatus('idle');
    setElapsed(0);
    setStartedAt(null);

    if (finalElapsed > 0 && user) {
      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        duration: finalElapsed,
        status: 'completed',
        created_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Error saving study session:', error);
        toast.error('Erro ao salvar sessão de estudo');
      } else {
        toast.success(`Sessão de ${formatTime(finalElapsed)} registrada!`);
      }
    }
  }, [elapsed, user]);

  return (
    <StudyTimerContext.Provider value={{ status, elapsed, start, pause, resume, stop }}>
      {children}
    </StudyTimerContext.Provider>
  );
}
