import { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, LogOut, CreditCard, History, Settings, ShieldCheck, CalendarDays, Brain, BookOpen } from 'lucide-react';
import { StudyTimerButton } from '@/components/StudyTimerButton';
import { LogoDark } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const isFreeUser = profile?.role === 'free_user';
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <LogoDark />
          <div className="flex items-center gap-3">
            {isFreeUser && (
              <Button
                onClick={() => navigate('/app/upgrade')}
                className="animate-pulse-subscribe bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold"
                size="sm"
              >
                ASSINAR
              </Button>
            )}
            <StudyTimerButton />
            <button
              onClick={() => navigate('/app/schedule')}
              className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary transition-colors"
              title="Cronograma"
            >
              <CalendarDays size={20} />
            </button>
            <button className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary transition-colors">
              <Bell size={20} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald text-primary-foreground text-xs font-bold">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[150px] truncate">
                    {profile?.full_name || user?.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/app/history')} className="cursor-pointer">
                  <History className="mr-2 h-4 w-4" />
                  Histórico
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/mentoria')} className="cursor-pointer">
                  <Brain className="mr-2 h-4 w-4" />
                  Mentoria
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/schedule')} className="cursor-pointer">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Cronograma
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/billing')} className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Meu Plano
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/manual')} className="cursor-pointer">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manual
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
