'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { isCompleteLoginCode } from '@soulsync/shared-types';
import { cn } from '@soulsync/ui/lib/utils';
import { guestLogin } from '@/lib/auth-api';
import { completeAuthSuccess } from '@/lib/auth-success';
import { LoginCodeField } from '@/components/auth/login-code-field';

export function GuestLoginForm() {
  const router = useRouter();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isCompleteLoginCode(code)) {
      setError('Enter all 16 digits of your login code.');
      return;
    }
    setPending(true);
    try {
      await guestLogin(code);
      completeAuthSuccess(router, 'Signed in as guest');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest login failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="space-y-4"
    >
      <LoginCodeField
        id="guest-login-code"
        label="16-digit login code"
        value={code}
        onChange={setCode}
        disabled={pending}
      />
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          'flex h-12 w-full items-center justify-center rounded-full text-base font-semibold text-white',
          'bg-gradient-to-r from-[var(--color-brand-600)] to-blue-600',
          'transition-opacity hover:opacity-95 disabled:opacity-60',
        )}
      >
        {pending ? 'Signing in…' : 'Continue as guest'}
      </button>
    </form>
  );
}
