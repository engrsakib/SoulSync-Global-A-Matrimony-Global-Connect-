'use client';

import * as React from 'react';
import { formatLoginCode } from '@soulsync/shared-types';
import { Copy } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { getStoredLoginCode } from '@/lib/login-code-storage';

type ProfileLoginCodeFieldProps = {
  userId: string;
  loginCodeFromServer: string | null;
};

export function ProfileLoginCodeField({ userId, loginCodeFromServer }: ProfileLoginCodeFieldProps) {
  const [copied, setCopied] = React.useState(false);
  const localDigits = getStoredLoginCode(userId);

  const formatted = loginCodeFromServer ?? (localDigits ? formatLoginCode(localDigits) : null);

  const copyCode = async () => {
    if (!formatted) {
      return;
    }
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <p className="text-xs font-medium text-[var(--muted-foreground)]">Login code</p>
      {formatted ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <p
            className={cn(
              'min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-3 py-2.5',
              'font-mono text-sm font-semibold tracking-[0.15em] text-[var(--foreground)] tabular-nums',
            )}
            aria-readonly
          >
            {formatted}
          </p>
          <button
            type="button"
            onClick={() => {
              void copyCode();
            }}
            className={cn(
              'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold',
              'bg-[var(--color-brand-700)] text-white transition hover:bg-[var(--color-brand-800)]',
            )}
          >
            <Copy className="h-4 w-4" aria-hidden />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Loading login code…</p>
      )}
      <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
        Your login code cannot be changed. Keep it private.
      </p>
    </div>
  );
}
