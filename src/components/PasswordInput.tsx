import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {}

export function PasswordInput({ className, onKeyDown, onBlur, ...props }: PasswordInputProps) {
  const [capsLock, setCapsLock] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState('CapsLock'));
    onKeyDown?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setCapsLock(false);
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <div>
      <Input
        type="password"
        className={cn(className)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        {...props}
      />
      {focused && capsLock && (
        <span className="mt-1 block text-xs text-amber-400 animate-in fade-in duration-200">
          ⚠ Caps Lock ativado
        </span>
      )}
    </div>
  );
}
