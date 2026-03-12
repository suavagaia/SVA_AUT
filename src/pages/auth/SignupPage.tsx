import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/auth/confirm' },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h1 className="mb-2 font-display text-2xl text-light">Verifique seu e-mail</h1>
          <p className="mb-6 text-muted-light">
            Enviamos um link de confirmação para <strong className="text-light">{email}</strong>.
            Verifique sua caixa de entrada e spam.
          </p>
          <Link to="/auth/login">
            <Button variant="outline" className="border-navy-border text-light hover:bg-navy">
              Voltar para Login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 font-display text-2xl text-light">Criar Conta</h1>
      <p className="mb-6 text-sm text-muted-light">Comece sua preparação para concursos jurídicos</p>

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
          <Label className="text-muted-light">Senha</Label>
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 border-navy-border bg-navy text-light placeholder:text-muted-light"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <Label className="text-muted-light">Confirmar Senha</Label>
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 border-navy-border bg-navy text-light placeholder:text-muted-light"
            placeholder="Repita a senha"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold"
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-light">
        Já tem uma conta?{' '}
        <Link to="/auth/login" className="text-emerald hover:underline">Fazer login</Link>
      </p>
    </AuthLayout>
  );
}
