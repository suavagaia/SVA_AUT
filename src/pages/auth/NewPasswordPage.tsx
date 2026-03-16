import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function NewPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Senha alterada com sucesso!');
      navigate('/app');
    }
  };

  return (
    <AuthLayout>
      <h1 className="mb-1 font-display text-2xl text-light">Nova Senha</h1>
      <p className="mb-6 text-sm text-muted-light">Defina sua nova senha abaixo</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-muted-light">Nova senha</Label>
          <PasswordInput
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 border-navy-border bg-navy text-light placeholder:text-muted-light"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <Label className="text-muted-light">Confirmar nova senha</Label>
          <PasswordInput
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 border-navy-border bg-navy text-light placeholder:text-muted-light"
            placeholder="Repita a nova senha"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground font-semibold"
        >
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthLayout>
  );
}
