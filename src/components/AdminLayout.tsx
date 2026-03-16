import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Activity, ArrowLeft, Database, Map, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Usuários', path: '/admin/users', icon: Users },
  { label: 'Prompts', path: '/admin/prompts', icon: FileText },
  { label: 'Interações', path: '/admin/interactions', icon: Activity },
  { label: 'Vector Stores', path: '/admin/vector-stores', icon: Database },
  { label: 'Áreas', path: '/admin/areas', icon: Map },
  { label: 'Concursos', path: '/admin/contests', icon: Trophy },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/auth/login'); return; }

    // Check admin role
    supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.role !== 'admin') {
          navigate('/app');
        } else {
          setAuthorized(true);
        }
      });
  }, [user, loading, navigate]);

  if (loading || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-deep">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-navy-deep">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-56 flex-col border-r border-navy-border bg-navy">
        <div className="flex h-16 items-center px-5 border-b border-navy-border">
          <span className="font-display text-lg text-light">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald/15 text-emerald'
                    : 'text-muted-light hover:bg-navy-border/50 hover:text-light'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-navy-border p-3">
          <Link
            to="/app"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-light hover:bg-navy-border/50 hover:text-light transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar ao app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-navy-border bg-navy px-6">
          <h1 className="font-display text-lg text-light">Sua Vaga IA — Admin</h1>
          <span className="text-sm text-muted-light">{profile?.email || user?.email}</span>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
