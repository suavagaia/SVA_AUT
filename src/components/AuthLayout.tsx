import { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4">
      <div className="mb-8">
        <Logo size="large" />
      </div>
      <div className="w-full max-w-md rounded-lg border border-navy-border bg-navy-deep p-8">
        {children}
      </div>
      <div className="mt-6 flex gap-4 text-sm text-muted-light">
        <Link to="/terms" className="hover:text-light transition-colors">Termos de Uso</Link>
        <span>·</span>
        <Link to="/privacy" className="hover:text-light transition-colors">Privacidade</Link>
      </div>
    </div>
  );
}
