'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { loginAccount } from '@/lib/auth-api';
import { completeAuthSuccess } from '@/lib/auth-success';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await loginAccount({ identifier: identifier.trim(), password });
      completeAuthSuccess(router);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
      <div className="space-y-2">
        <Label htmlFor="identifier">Email, username, or login code</Label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          className={inputClass}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[var(--primary)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
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
          'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]',
          'transition-opacity hover:opacity-95 disabled:opacity-60',
        )}
      >
        {pending ? 'Signing in…' : 'Log in'}
      </button>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        New here?{' '}
        <Link href="/register" className="font-medium text-[var(--primary)] hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
