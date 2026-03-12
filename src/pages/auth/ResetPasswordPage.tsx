import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/update-password',
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h1 className="mb-2 font-display text-2xl text-light">Verifique seu e-mail</h1>
          <p className="mb-6 text-muted-light">
            Enviamos instruções para redefinir sua senha para <strong className="text-light">{email}</strong>.
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
      <h1 className="mb-1 font-display text-2xl text-light">Redefinir Senha</h1>
      <p className="mb-6 text-sm text-muted-light">Informe seu e-mail para receber o link de redefinição</p>

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
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold"
        >
          {loading ? 'Enviando...' : 'Enviar Link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-light">
        <Link to="/auth/login" className="text-emerald hover:underline">Voltar para Login</Link>
      </p>
    </AuthLayout>
  );
}
