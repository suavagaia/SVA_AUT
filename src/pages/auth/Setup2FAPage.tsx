import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

export default function Setup2FAPage() {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);

  useEffect(() => {
    enrollFactor();
  }, []);

  const enrollFactor = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Sua Vaga IA', friendlyName: 'Sua Vaga IA' });
    if (error) {
      toast.error('Erro ao configurar 2FA. Tente novamente.');
      setEnrolling(false);
      return;
    }
    if (data) {
      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
    }
    setEnrolling(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (error) {
        toast.error('Código inválido. Tente novamente.');
      } else {
        toast.success('2FA ativado com sucesso!');
        navigate('/app/areas', { replace: true });
      }
    } catch {
      toast.error('Erro ao verificar código.');
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={24} className="text-emerald" />
        <h1 className="font-display text-2xl text-light">Configurar 2FA</h1>
      </div>
      <p className="mb-6 text-sm text-muted-light">
        A autenticação de dois fatores é obrigatória para sua conta. Escaneie o QR code com seu aplicativo autenticador (Google Authenticator, Authy, etc).
      </p>

      {enrolling ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
        </div>
      ) : (
        <>
          {qrCode && (
            <div className="flex justify-center mb-6">
              <div className="rounded-lg bg-white p-3">
                <img src={qrCode} alt="QR Code 2FA" className="h-48 w-48" />
              </div>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label className="text-muted-light">Código de verificação</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 border-navy-border bg-navy text-light placeholder:text-muted-light text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold"
            >
              {loading ? 'Verificando...' : 'Ativar 2FA'}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
