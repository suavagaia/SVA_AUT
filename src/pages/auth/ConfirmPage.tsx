import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function ConfirmPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
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
        return;
      }

      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (!error) {
        navigate(next, { replace: true });
      } else {
        setError('Link inválido ou expirado.');
      }
    };

    handleConfirm();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
