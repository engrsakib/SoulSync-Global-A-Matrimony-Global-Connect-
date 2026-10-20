'use client';

import * as React from 'react';
import { Label } from '@soulsync/ui/label';
import { formatLoginCode, normalizeLoginCode } from '@soulsync/shared-types';
import { cn } from '@soulsync/ui/lib/utils';

type LoginCodeFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (normalizedDigits: string) => void;
  className?: string;
  disabled?: boolean;
};

export function LoginCodeField({
  id,
  label,
  value,
  onChange,
  className,
  disabled,
}: LoginCodeFieldProps) {
  const display = formatLoginCode(value);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(normalizeLoginCode(event.target.value));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={display}
        onChange={handleChange}
        placeholder="1234 5678 1234 5678"
        className={cn(
          'flex h-12 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2',
          'font-mono text-lg tracking-widest tabular-nums',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        maxLength={19}
      />
    </div>
  );
}
