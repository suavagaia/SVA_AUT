import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

export default function Verify2FAPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadFactor();
  }, []);

  const loadFactor = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data?.totp?.length) {
      toast.error('Nenhum fator 2FA encontrado.');
      navigate('/auth/login', { replace: true });
      return;
    }
    const verifiedFactor = data.totp.find(f => f.status === 'verified');
    if (verifiedFactor) {
      setFactorId(verifiedFactor.id);
      setReady(true);
    } else {
      navigate('/setup-2fa', { replace: true });
    }
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
        navigate('/app/areas', { replace: true });
      }
    } catch {
      toast.error('Erro ao verificar código.');
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <AuthLayout>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={24} className="text-emerald" />
        <h1 className="font-display text-2xl text-light">Verificação 2FA</h1>
      </div>
      <p className="mb-6 text-sm text-muted-light">
        Digite o código de 6 dígitos do seu aplicativo autenticador.
      </p>

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
          {loading ? 'Verificando...' : 'Verificar'}
        </Button>
      </form>
    </AuthLayout>
  );
}
