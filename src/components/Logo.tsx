import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo({ size = 'default' }: { size?: 'default' | 'large' }) {
  const textClass = size === 'large' ? 'text-2xl' : 'text-xl';
  const iconSize = size === 'large' ? 28 : 22;

  return (
    <Link to="/" className="flex items-center gap-2">
      <CheckCircle size={iconSize} className="text-emerald" />
      <span className={`${textClass} font-bold`}>
        <span className="text-emerald">Sua Vaga</span>
        {' '}
        <span className="font-normal text-light">IA</span>
      </span>
    </Link>
  );
}

export function LogoDark({ size = 'default' }: { size?: 'default' | 'large' }) {
  const textClass = size === 'large' ? 'text-2xl' : 'text-xl';
  const iconSize = size === 'large' ? 28 : 22;

  return (
    <Link to="/" className="flex items-center gap-2">
      <CheckCircle size={iconSize} className="text-emerald" />
      <span className={`${textClass} font-bold`}>
        <span className="text-emerald">Sua Vaga</span>
        {' '}
        <span className="font-normal text-foreground">IA</span>
      </span>
    </Link>
  );
}
