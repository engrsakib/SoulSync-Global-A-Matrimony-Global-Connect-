'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@soulsync/ui/lib/utils';
import { createGuestAccount } from '@/lib/auth-api';
import { completeAuthSuccess } from '@/lib/auth-success';
import { GuestCodeReveal } from '@/components/auth/guest-code-reveal';

export function GuestCreatePanel() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [loginCodePlain, setLoginCodePlain] = React.useState<string | null>(null);

  const createGuest = async () => {
    setError(null);
    setPending(true);
    try {
      const result = await createGuestAccount();
      if (result.loginCodePlain) {
        setLoginCodePlain(result.loginCodePlain);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create guest access');
    } finally {
      setPending(false);
    }
  };

  if (loginCodePlain) {
    return (
      <div className="space-y-6">
        <GuestCodeReveal
          loginCodePlain={loginCodePlain}
          description="Guest profile name is Guest plus the last four digits. Save this code — it is your only way back in."
        />
        <button
          type="button"
          className={cn(
            'flex h-12 w-full items-center justify-center rounded-full text-base font-semibold text-white',
            'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]',
          )}
          onClick={() => completeAuthSuccess(router, 'Guest access ready')}
        >
          Continue to home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
        Browse without a full account. We will generate a unique 16-digit login code for you.
      </p>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          void createGuest();
        }}
        className={cn(
          'flex h-12 w-full items-center justify-center rounded-full text-base font-semibold text-white',
          'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]',
          'transition-opacity hover:opacity-95 disabled:opacity-60',
        )}
      >
        {pending ? 'Creating guest access…' : 'Get guest login code'}
      </button>
    </div>
  );
}
