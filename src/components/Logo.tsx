import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogoIcon } from '@/components/LogoIcon';

export function Logo({ size = 'default' }: { size?: 'default' | 'large' }) {
  const textClass = size === 'large' ? 'text-2xl' : 'text-xl';
  const iconSize = size === 'large' ? 36 : 28;
  const { session } = useAuth();
  const to = session ? '/app/areas' : '/';

  return (
    <Link to={to} className="flex items-center gap-2">
      <LogoIcon size={iconSize} />
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
  const iconSize = size === 'large' ? 36 : 28;
  const { session } = useAuth();
  const to = session ? '/app/areas' : '/';

  return (
    <Link to={to} className="flex items-center gap-2">
      <LogoIcon size={iconSize} />
      <span className={`${textClass} font-bold`}>
        <span className="text-emerald">Sua Vaga</span>
        {' '}
        <span className="font-normal text-foreground">IA</span>
      </span>
    </Link>
  );
}
