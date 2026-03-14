import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, Zap, MessageSquare } from 'lucide-react';

interface RecentInteraction {
  id: string;
  created_at: string;
  tokens_charged: number;
  model_used: string;
  users: { email: string } | null;
  agents: { title: string } | null;
}

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [tokensToday, setTokensToday] = useState(0);
  const [interactionsToday, setInteractionsToday] = useState(0);
  const [recent, setRecent] = useState<RecentInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [usersRes, subsRes, usageRes, recentRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'subscriber'),
        supabase.from('token_usage_events').select('tokens_charged').gte('created_at', today.toISOString()),
        supabase
          .from('token_usage_events')
          .select('id, created_at, tokens_charged, model_used, users(email), agents(title)')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      setTotalUsers(usersRes.count ?? 0);
      setActiveSubscribers(subsRes.count ?? 0);
      const usage = usageRes.data ?? [];
      setTokensToday(usage.reduce((s, r) => s + (r.tokens_charged || 0), 0));
      setInteractionsToday(usage.length);
      setRecent((recentRes.data as any) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const metrics = [
    { label: 'Total de Usuários', value: totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'Assinantes Ativos', value: activeSubscribers, icon: CreditCard, color: 'text-emerald' },
    { label: 'Tokens Hoje', value: tokensToday.toLocaleString(), icon: Zap, color: 'text-yellow-400' },
    { label: 'Interações Hoje', value: interactionsToday, icon: MessageSquare, color: 'text-purple-400' },
  ];

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {metrics.map((m) => (
              <Card key={m.label} className="bg-navy border-navy-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-light">{m.label}</CardTitle>
                  <m.icon size={18} className={m.color} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-light">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-navy border-navy-border">
            <CardHeader>
              <CardTitle className="text-light text-base">Interações Recentes</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-border text-muted-light text-left">
                    <th className="pb-2 pr-4">Data</th>
                    <th className="pb-2 pr-4">Usuário</th>
                    <th className="pb-2 pr-4">Agente</th>
                    <th className="pb-2 pr-4">Modelo</th>
                    <th className="pb-2">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-navy-border/50 text-light">
                      <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                      <td className="py-2 pr-4">{(r.users as any)?.email ?? '—'}</td>
                      <td className="py-2 pr-4">{(r.agents as any)?.title ?? '—'}</td>
                      <td className="py-2 pr-4">{r.model_used}</td>
                      <td className="py-2">{r.tokens_charged}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
