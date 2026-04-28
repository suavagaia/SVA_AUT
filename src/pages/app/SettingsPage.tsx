import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, Shield, ShieldCheck, CreditCard, LogOut, Trash2, ArrowRight } from 'lucide-react';
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

  // 2FA state
  const [has2FA, setHas2FA] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);

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
    check2FAStatus();
  }, [user]);

  const check2FAStatus = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find(f => f.status === 'verified');
    setHas2FA(!!verified);
    if (verified) setFactorId(verified.id);
  };

  const handleEnable2FA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Sua Vaga IA', friendlyName: 'Sua Vaga IA' });
    if (error) {
      toast.error('Erro ao iniciar configuração 2FA.');
      return;
    }
    if (data) {
      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
      setShow2FASetup(true);
      setTotpCode('');
    }
  };

  const handleConfirm2FA = async () => {
    if (totpCode.length !== 6) return;
    setVerifying2FA(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: totpCode });
    if (error) {
      toast.error('Código inválido.');
    } else {
      toast.success('2FA ativado com sucesso!');
      setShow2FASetup(false);
      setHas2FA(true);
    }
    setVerifying2FA(false);
  };

  const handleDisable2FA = async () => {
    setDisabling2FA(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast.error('Erro ao desativar 2FA.');
    } else {
      toast.success('2FA desativado.');
      setHas2FA(false);
      setFactorId('');
    }
    setDisabling2FA(false);
  };

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
      redirectTo: `${window.location.origin}/auth/reset-password`,
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
          <CardContent className="space-y-4">
            <div>
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
            </div>

            <Separator />

            {/* 2FA Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-emerald" />
                <span className="text-sm font-medium">Autenticação de dois fatores (2FA)</span>
                {has2FA && (
                  <Badge className="bg-emerald/20 text-emerald border-emerald/30 text-xs">Ativo</Badge>
                )}
              </div>

              {has2FA && !show2FASetup ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10" disabled={disabling2FA}>
                      {disabling2FA ? 'Desativando...' : 'Desativar 2FA'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desativar 2FA</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ao desativar a autenticação de dois fatores, sua conta ficará menos protegida.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDisable2FA} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Desativar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : !show2FASetup ? (
                <div>
                  <Button variant="outline" size="sm" onClick={handleEnable2FA}>
                    Ativar 2FA
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicione uma camada extra de segurança à sua conta.
                  </p>
                </div>
              ) : null}

              {show2FASetup && (
                <div className="mt-3 rounded-lg border border-navy-border bg-navy/50 p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR code com seu aplicativo autenticador:
                  </p>
                  {qrCode && (
                    <div className="flex justify-center">
                      <div className="rounded-lg bg-white p-3">
                        <img src={qrCode} alt="QR Code 2FA" className="h-40 w-40" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm">Código de verificação</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="text-center text-lg tracking-[0.3em] font-mono max-w-[200px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleConfirm2FA}
                      disabled={verifying2FA || totpCode.length !== 6}
                      className="bg-emerald hover:bg-emerald/90 text-primary-foreground"
                    >
                      {verifying2FA ? 'Verificando...' : 'Confirmar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setShow2FASetup(false); setQrCode(''); setTotpCode(''); }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uso do mês</span>
                {profile?.tokens_remaining != null && (() => {
                  const planMax = (profile.tokens_remaining ?? 0) > 700_000 ? 1_000_000 : 600_000;
                  const used = planMax - (profile.tokens_remaining ?? 0);
                  const pct = Math.min(Math.round((used / planMax) * 100), 100);
                  const now = new Date();
                  const daysLeft = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - now.getTime()) / 86400000);
                  return (
                    <span className="text-sm font-medium text-foreground">{pct}% — renova em {daysLeft}d</span>
                  );
                })()}
              </div>
              {profile?.tokens_remaining != null && (() => {
                const planMax = (profile.tokens_remaining ?? 0) > 700_000 ? 1_000_000 : 600_000;
                const used = planMax - (profile.tokens_remaining ?? 0);
                const pct = Math.min(Math.round((used / planMax) * 100), 100);
                const barColor = pct >= 95 ? 'bg-destructive' : pct >= 80 ? 'bg-yellow-500' : 'bg-emerald';
                return (
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                );
              })()}
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
