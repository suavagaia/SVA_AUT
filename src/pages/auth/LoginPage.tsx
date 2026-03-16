import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error('E-mail ou senha incorretos');
      return;
    }

    // Check MFA requirements
    try {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const currentLevel = aalData?.currentLevel;
      const nextLevel = aalData?.nextLevel;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser?.id)
        .single();

      const isAdmin = roleData?.role === 'admin';

      if (isAdmin && currentLevel === 'aal1') {
        if (nextLevel === 'aal1') {
          navigate('/setup-2fa', { replace: true });
          return;
        }
        if (nextLevel === 'aal2') {
          navigate('/verify-2fa', { replace: true });
          return;
        }
      }

      if (!isAdmin && nextLevel === 'aal2' && currentLevel === 'aal1') {
        navigate('/verify-2fa', { replace: true });
        return;
      }
    } catch {
      // If MFA check fails, continue to app
    }

    navigate('/app/areas');
  };

  return (
    <AuthLayout>
      <h1 className="mb-1 font-display text-2xl text-light">Entrar</h1>
      <p className="mb-6 text-sm text-muted-light">Acesse sua conta e continue estudando</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-muted-light">E-mail</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 border-navy-border bg-navy text-light placeholder:text-muted-light"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-muted-light">Senha</Label>
            <Link to="/auth/forgot-password" className="text-xs text-emerald hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <PasswordInput
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 border-navy-border bg-navy text-light placeholder:text-muted-light"
            placeholder="Sua senha"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-light">
        Não tem uma conta?{' '}
        <Link to="/auth/signup" className="text-emerald hover:underline">Criar conta</Link>
      </p>
    </AuthLayout>
  );
}
