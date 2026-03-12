import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function ConfirmPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleConfirm = async () => {
      // Supabase auto-handles the token exchange via the URL hash
      const { error } = await supabase.auth.getSession();
      if (error) {
        setError('Erro ao confirmar e-mail. Tente novamente.');
      } else {
        navigate('/thank-you/test', { replace: true });
      }
    };

    handleConfirm();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <p className="text-light">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald border-t-transparent" />
    </div>
  );
}
