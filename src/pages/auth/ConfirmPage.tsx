import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function ConfirmPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const handleConfirm = async () => {
      const params = new URLSearchParams(window.location.search);
      const token_hash = params.get('token_hash');
      const type = params.get('type') as any;
      const next = params.get('next') || '/app';

      if (!token_hash || !type) {
        setError('Link inválido ou expirado.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (!error) {
        navigate(next, { replace: true });
      } else {
        setError('Link inválido ou expirado. Solicite um novo link.');
        setLoading(false);
      }
    };

    handleConfirm();

    // Timeout de segurança — se demorar mais de 10s, mostra erro
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Tempo esgotado. Solicite um novo link.');
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">{error}</p>
        
          href="/auth/forgot-password"
          className="text-sm text-primary underline hover:opacity-80"
        >
          Solicitar novo link
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
