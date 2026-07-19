import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string;
  role: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  agents_tokens_remaining: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Role dialog
  const [roleDialog, setRoleDialog] = useState<{ user: UserRow; newRole: string } | null>(null);
  // Token dialog
  const [tokenDialog, setTokenDialog] = useState<{ user: UserRow; amount: string } | null>(null);
  // Refund dialog
  const [refundDialog, setRefundDialog] = useState<{ user: UserRow } | null>(null);
  const [refunding, setRefunding] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, email, role, subscription_status, subscription_plan, agents_tokens_remaining, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setUsers((data as UserRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.email?.toLowerCase().includes(q));
  }, [users, search]);

  const handleRoleChange = async () => {
    if (!roleDialog) return;
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: roleDialog.user.id, role: roleDialog.newRole }, { onConflict: 'user_id' });
    if (error) { toast.error(error.message); return; }
    toast.success(`Role alterada para ${roleDialog.newRole}`);
    setRoleDialog(null);
    fetchUsers();
  };

  const handleAddTokens = async () => {
    if (!tokenDialog) return;
    const amount = parseInt(tokenDialog.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Quantidade inválida'); return; }

    const { data: bal } = await supabase
      .from('user_token_balances')
      .select('agents_tokens_remaining')
      .eq('user_id', tokenDialog.user.id)
      .single();

    const { error } = await supabase
      .from('user_token_balances')
      .upsert({
        user_id: tokenDialog.user.id,
        agents_tokens_remaining: (bal?.agents_tokens_remaining ?? 0) + amount,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) { toast.error(error.message); return; }
    toast.success(`${amount} tokens adicionados`);
    setTokenDialog(null);
    fetchUsers();
  };

  const handleRefund = async () => {
    if (!refundDialog) return;
    setRefunding(true);
    const { data, error } = await supabase.functions.invoke('admin-refund', { body: { user_id: refundDialog.user.id } });
    setRefunding(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || 'Erro no reembolso'); return; }
    const val = (data as any)?.refunded_amount_brl;
    toast.success(`Reembolso concluído${val != null ? ` (R$ ${Number(val).toFixed(2)})` : ''} e acesso cortado.`);
    setRefundDialog(null);
    fetchUsers();
  };

  return (
    <AdminLayout>
      <Card className="bg-navy border-navy-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-light text-base">Usuários</CardTitle>
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por email..."
              className="pl-9 border-navy-border bg-navy-deep text-light placeholder:text-muted-light"
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-border text-muted-light text-left">
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Plano</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Tokens</th>
                  <th className="pb-2 pr-4">Criado em</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-navy-border/50 text-light">
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.role}</td>
                    <td className="py-2 pr-4">{u.subscription_plan ?? '—'}</td>
                    <td className="py-2 pr-4">{u.subscription_status ?? '—'}</td>
                    <td className="py-2 pr-4">{u.agents_tokens_remaining ?? 0}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-light hover:text-light">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setRoleDialog({ user: u, newRole: u.role })}>
                            Alterar role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTokenDialog({ user: u, amount: '' })}>
                            Adicionar tokens
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/interactions?user_email=${encodeURIComponent(u.email)}`)}>
                            Ver interações
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => setRefundDialog({ user: u })}>
                            Reembolsar (7 dias)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={() => setRoleDialog(null)}>
        <DialogContent className="bg-navy border-navy-border text-light">
          <DialogHeader>
            <DialogTitle>Alterar Role — {roleDialog?.user.email}</DialogTitle>
          </DialogHeader>
          <Select value={roleDialog?.newRole} onValueChange={(v) => setRoleDialog((prev) => prev ? { ...prev, newRole: v } : null)}>
            <SelectTrigger className="border-navy-border bg-navy-deep text-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free_user">free_user</SelectItem>
              <SelectItem value="subscriber">subscriber</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={handleRoleChange} className="bg-emerald hover:bg-emerald-hover text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token Dialog */}
      <Dialog open={!!tokenDialog} onOpenChange={() => setTokenDialog(null)}>
        <DialogContent className="bg-navy border-navy-border text-light">
          <DialogHeader>
            <DialogTitle>Adicionar Tokens — {tokenDialog?.user.email}</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            min={1}
            value={tokenDialog?.amount ?? ''}
            onChange={(e) => setTokenDialog((prev) => prev ? { ...prev, amount: e.target.value } : null)}
            placeholder="Quantidade de tokens"
            className="border-navy-border bg-navy-deep text-light placeholder:text-muted-light"
          />
          <DialogFooter>
            <Button onClick={handleAddTokens} className="bg-emerald hover:bg-emerald-hover text-primary-foreground">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={!!refundDialog} onOpenChange={() => !refunding && setRefundDialog(null)}>
        <DialogContent className="bg-navy border-navy-border text-light">
          <DialogHeader>
            <DialogTitle>Reembolso de 7 dias — {refundDialog?.user.email}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-light">
            Esta ação <strong className="text-light">reembolsa integralmente</strong> a última cobrança no Stripe,
            <strong className="text-light"> cancela a assinatura</strong> e <strong className="text-light">corta o acesso</strong> do
            usuário imediatamente. É irreversível.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRefundDialog(null)} disabled={refunding}>Cancelar</Button>
            <Button onClick={handleRefund} disabled={refunding} className="bg-red-600 hover:bg-red-700 text-white">
              {refunding ? 'Processando...' : 'Reembolsar e cortar acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
