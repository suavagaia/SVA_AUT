import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errorMonitor';
import { toast } from 'sonner';

// Guarda contra tempestade de refresh de token (ex.: relógio do dispositivo
// dessincronizado faz o SDK achar que todo token novo já nasceu expirado e
// tenta renovar de novo imediatamente, em loop). Sem isso, o usuário via um
// loop silencioso: login -> tela travada -> sessão cai -> login de novo.
const AUTH_EVENT_WINDOW_MS = 8_000;
const AUTH_EVENT_STORM_THRESHOLD = 6;

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  tokens_remaining: number;
  stripe_customer_id: string | null;
  // null = plano FULL (todos os concursos); uuid = plano SINGLE (trava no concurso)
  contest_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, attempt = 1): Promise<void> => {
    // user_profiles (view) não expõe contest_id — buscamos direto de users
    // (RLS permite o próprio usuário ler sua linha).
    const [{ data }, { data: userRow }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase.from('users').select('contest_id').eq('id', userId).single(),
    ]);
    if (data) {
      setProfile({ ...data, contest_id: userRow?.contest_id ?? null });
      return;
    }
    // Sem dado ainda (ex.: trigger de criação de linha ainda não terminou logo
    // após signup, ou falha transitória) — tenta mais algumas vezes antes de
    // desistir, pra não deixar as telas presas em loading pra sempre.
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, attempt * 1000));
      return fetchProfile(userId, attempt + 1);
    }
    throw new Error('profile_not_found_after_retries');
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const eventTimestampsRef = useRef<number[]>([]);
  const breakerTrippedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const now = Date.now();
        eventTimestampsRef.current = eventTimestampsRef.current.filter((t) => now - t < AUTH_EVENT_WINDOW_MS);
        eventTimestampsRef.current.push(now);

        if (eventTimestampsRef.current.length >= AUTH_EVENT_STORM_THRESHOLD) {
          if (!breakerTrippedRef.current) {
            breakerTrippedRef.current = true;
            eventTimestampsRef.current = [];
            logError('auth_refresh_storm', 'Loop de renovação de sessão detectado — sessão encerrada preventivamente', {
              event,
              url: window.location.pathname,
              user_id: session?.user?.id ?? null,
            });
            toast.error('Sua sessão encontrou um problema de sincronização (verifique a data/hora do seu dispositivo) e foi encerrada por segurança. Faça login novamente.');
            supabase.auth.signOut().finally(() => {
              setSession(null);
              setUser(null);
              setProfile(null);
              setLoading(false);
            });
          }
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          breakerTrippedRef.current = false;
          fetchProfile(session.user.id).catch((err) => {
            logError('profile_fetch_failed', err?.message ?? 'fetchProfile falhou', { user_id: session.user.id });
          });
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('selectedArea');
    localStorage.removeItem('selectedContest');
    localStorage.removeItem('selectedSubject');
    localStorage.removeItem('selectedAgent');
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
