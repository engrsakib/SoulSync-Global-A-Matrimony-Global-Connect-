'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { formControlClass } from '@/lib/ui-classes';

const inputClass = cn(formControlClass, 'py-2 pl-3 pr-11');

type PasswordInputProps = {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  autoComplete,
  disabled,
  required,
  className,
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className={cn('relative', className)}>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md',
          'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((show) => !show)}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
