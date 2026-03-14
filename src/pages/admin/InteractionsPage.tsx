import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Interaction {
  id: string;
  created_at: string;
  tokens_charged: number;
  prompt_tokens: number;
  completion_tokens: number;
  model_used: string;
  users: { email: string } | null;
  agents: { title: string } | null;
  
}

interface AgentOption { id: string; title: string; }

export default function AdminInteractionsPage() {
  const [searchParams] = useSearchParams();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [emailSearch, setEmailSearch] = useState(searchParams.get('user_email') ?? '');
  const [agentFilter, setAgentFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('agents').select('id, title').order('title').then(({ data }) => setAgents(data ?? []));
  }, []);

  const fetchInteractions = useCallback(async (append = false) => {
    setLoading(true);

    // Resolve user_id from email if needed
    let userIdFilter: string | null = null;
    if (emailSearch.trim()) {
      const { data: u } = await supabase.from('users').select('id').ilike('email', `%${emailSearch.trim()}%`).limit(1).single();
      if (u) userIdFilter = u.id;
      else { setInteractions(append ? interactions : []); setLoading(false); return; }
    }

    let periodDate: string | null = null;
    const now = new Date();
    if (periodFilter === 'today') { const d = new Date(); d.setHours(0,0,0,0); periodDate = d.toISOString(); }
    else if (periodFilter === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); periodDate = d.toISOString(); }
    else if (periodFilter === 'month') { const d = new Date(now); d.setMonth(d.getMonth() - 1); periodDate = d.toISOString(); }

    let query = supabase
      .from('token_usage_events')
      .select('id, created_at, tokens_charged, prompt_tokens, completion_tokens, model_used, users(email), agents(title), conversations(title)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (userIdFilter) query = query.eq('user_id', userIdFilter);
    if (agentFilter !== 'all') query = query.eq('agent_id', agentFilter);
    if (periodDate) query = query.gte('created_at', periodDate);
    if (append && cursor) query = query.lt('created_at', cursor);

    const { data } = await query;
    const rows = (data as any as Interaction[]) ?? [];
    setInteractions(append ? [...interactions, ...rows] : rows);
    if (rows.length > 0) setCursor(rows[rows.length - 1].created_at);
    setLoading(false);
  }, [emailSearch, agentFilter, periodFilter, cursor, interactions]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setCursor(null); fetchInteractions(false); }, 400);
    return () => clearTimeout(t);
  }, [emailSearch, agentFilter, periodFilter]);

  return (
    <AdminLayout>
      <Card className="bg-navy border-navy-border">
        <CardHeader>
          <CardTitle className="text-light text-base">Interações</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light" />
              <Input
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                placeholder="Buscar por email..."
                className="pl-9 border-navy-border bg-navy-deep text-light placeholder:text-muted-light"
              />
            </div>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-48 border-navy-border bg-navy-deep text-light">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os agentes</SelectItem>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-40 border-navy-border bg-navy-deep text-light">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-border text-muted-light text-left">
                  <th className="pb-2 pr-3">Data</th>
                  <th className="pb-2 pr-3">Usuário</th>
                  <th className="pb-2 pr-3">Conversa</th>
                  <th className="pb-2 pr-3">Agente</th>
                  <th className="pb-2 pr-3">Modelo</th>
                  <th className="pb-2 pr-3">Prompt</th>
                  <th className="pb-2 pr-3">Completion</th>
                  <th className="pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {interactions.map((r) => (
                  <tr key={r.id} className="border-b border-navy-border/50 text-light">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                    <td className="py-2 pr-3">{(r.users as any)?.email ?? '—'}</td>
                    <td className="py-2 pr-3 max-w-[150px] truncate">{(r.conversations as any)?.title ?? '—'}</td>
                    <td className="py-2 pr-3">{(r.agents as any)?.title ?? '—'}</td>
                    <td className="py-2 pr-3">{r.model_used}</td>
                    <td className="py-2 pr-3">{r.prompt_tokens}</td>
                    <td className="py-2 pr-3">{r.completion_tokens}</td>
                    <td className="py-2">{r.tokens_charged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && interactions.length >= 100 && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => fetchInteractions(true)} className="border-navy-border text-light hover:bg-navy-border/50">
                Carregar mais 100
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
