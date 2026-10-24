'use client';

import * as React from 'react';
import { cn } from '@soulsync/ui/lib/utils';

const CODE_LENGTH = 6;

type VerificationCodeInputProps = {
  id: string;
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  'aria-labelledby'?: string;
  className?: string;
};

function normalizeDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
}

export function VerificationCodeInput({
  id,
  value,
  onChange,
  disabled,
  'aria-labelledby': ariaLabelledBy,
  className,
}: VerificationCodeInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = normalizeDigits(value).split('');
  while (digits.length < CODE_LENGTH) {
    digits.push('');
  }

  const setDigits = (next: string[]) => {
    onChange(next.join('').replace(/\D/g, '').slice(0, CODE_LENGTH));
  };

  const focusIndex = (index: number) => {
    const el = refs.current[index];
    el?.focus();
    el?.select();
  };

  const handleChange = (index: number, char: string) => {
    const d = normalizeDigits(char);
    if (!d) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }
    const next = [...digits];
    let i = index;
    for (const ch of d) {
      if (i >= CODE_LENGTH) {
        break;
      }
      next[i] = ch;
      i += 1;
    }
    setDigits(next);
    if (i < CODE_LENGTH) {
      focusIndex(i);
    } else {
      refs.current[CODE_LENGTH - 1]?.blur();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = '';
        setDigits(next);
        focusIndex(index - 1);
      }
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = normalizeDigits(event.clipboardData.getData('text'));
    if (!pasted) {
      return;
    }
    onChange(pasted);
    const focusAt = Math.min(pasted.length, CODE_LENGTH - 1);
    focusIndex(focusAt);
  };

  return (
    <div
      role="group"
      aria-labelledby={ariaLabelledBy}
      className={cn('flex justify-center gap-2 sm:gap-2.5', className)}
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          key={`${id}-${index}`}
          ref={(el) => {
            refs.current[index] = el;
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
          disabled={disabled}
          maxLength={CODE_LENGTH}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn(
            'size-11 shrink-0 rounded-lg border-2 bg-[var(--card)] text-center text-lg font-semibold tabular-nums sm:size-12',
            'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            digit
              ? 'border-[var(--color-brand-600)] text-[var(--color-brand-600)]'
              : 'border-[var(--border)] text-[var(--foreground)] focus:border-[var(--color-brand-600)]',
          )}
        />
      ))}
    </div>
  );
}
