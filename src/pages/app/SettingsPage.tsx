import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, Shield, CreditCard, LogOut, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
      });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('users').update({ full_name: fullName.trim() }).eq('id', user.id);
    if (error) {
      toast.error('Erro ao salvar alterações.');
    } else {
      toast.success('Perfil atualizado com sucesso!');
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/app/settings`,
    });
    if (error) {
      toast.error('Erro ao enviar email de redefinição.');
    } else {
      toast.success(`Email de redefinição enviado para ${user.email}`);
    }
    setResetSending(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    await supabase.auth.signOut();
    toast.success('Conta excluída. Entre em contato com suporte@suavagaia.com.br se precisar de ajuda.');
    navigate('/');
  };

  const planLabel = profile?.subscription_plan
    ? profile.subscription_plan === 'monthly' ? 'Mensal'
      : profile.subscription_plan === 'annual' ? 'Anual'
        : profile.subscription_plan
    : 'Gratuito';

  const statusLabel = profile?.subscription_status === 'active' ? 'Ativa'
    : profile?.subscription_status === 'canceled' ? 'Cancelada'
      : profile?.subscription_status === 'past_due' ? 'Pendente'
        : 'Inativa';

  const statusColor = profile?.subscription_status === 'active'
    ? 'bg-emerald/20 text-emerald border-emerald/30'
    : 'bg-destructive/20 text-destructive border-destructive/30';

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-2xl text-foreground">Configurações</h1>

        {/* A. Perfil */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User size={20} className="text-emerald" />
              <CardTitle className="text-lg">Perfil</CardTitle>
            </div>
            <CardDescription>Gerencie suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="opacity-60" />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={saving || !fullName.trim()}
              className="bg-emerald hover:bg-emerald/90 text-primary-foreground"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </CardContent>
        </Card>

        {/* B. Segurança */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-emerald" />
              <CardTitle className="text-lg">Segurança</CardTitle>
            </div>
            <CardDescription>Gerencie sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleResetPassword}
              disabled={resetSending}
            >
              {resetSending ? 'Enviando...' : 'Alterar senha'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Enviaremos um email com link para redefinição de senha.
            </p>
          </CardContent>
        </Card>

        {/* C. Plano */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-emerald" />
              <CardTitle className="text-lg">Plano e Assinatura</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Plano:</span>
              <span className="text-sm font-medium text-foreground">{planLabel}</span>
              <Badge className={statusColor}>{statusLabel}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Tokens restantes:</span>
              <span className="text-sm font-medium text-foreground">
                {profile?.tokens_remaining != null
                  ? new Intl.NumberFormat('pt-BR').format(profile.tokens_remaining)
                  : '—'}
              </span>
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-emerald"
              onClick={() => navigate('/app/billing')}
            >
              Gerenciar assinatura <ArrowRight size={14} className="ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* D. Conta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Todas as suas conversas e dados serão permanentemente excluídos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir minha conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
