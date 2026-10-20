'use client';

import { validatePassword, type PasswordValidationResult } from '@soulsync/shared-types';
import { cn } from '@soulsync/ui/lib/utils';

type PasswordStrengthProps = {
  password: string;
  className?: string;
};

function strengthBarClass(strength: PasswordValidationResult['strength']): string {
  if (strength === 'strong') {
    return 'bg-emerald-500';
  }
  if (strength === 'fair') {
    return 'bg-amber-500';
  }
  return 'bg-red-400';
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const result = validatePassword(password);
  const filled =
    result.strength === 'strong' ? 3 : result.strength === 'fair' ? 2 : password.length > 0 ? 1 : 0;

  const checklist = [
    { key: 'minLength', label: 'At least 8 characters' },
    { key: 'uppercase', label: 'One uppercase letter' },
    { key: 'lowercase', label: 'One lowercase letter' },
    { key: 'digit', label: 'One number' },
    { key: 'special', label: 'One special character' },
  ] as const;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full bg-[var(--muted)]',
              index < filled && strengthBarClass(result.strength),
            )}
          />
        ))}
      </div>
      <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
        {checklist.map((item) => (
          <li
            key={item.key}
            className={cn(
              'flex items-center gap-2',
              result.checks[item.key] && 'text-[var(--foreground)]',
            )}
          >
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                result.checks[item.key] ? 'bg-emerald-500' : 'bg-[var(--border)]',
              )}
              aria-hidden
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
