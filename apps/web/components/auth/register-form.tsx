'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { normalizeUsername, validatePassword, validateUsername } from '@soulsync/shared-types';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { registerAccount } from '@/lib/auth-api';
import { completeAuthSuccess } from '@/lib/auth-success';
import { GuestCodeReveal } from '@/components/auth/guest-code-reveal';
import { PasswordStrength } from '@/components/auth/password-strength';
import { UsernameField, type UsernameAvailabilityState } from '@/components/auth/username-field';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [loginCodePlain, setLoginCodePlain] = React.useState<string | null>(null);
  const [usernameState, setUsernameState] = React.useState<UsernameAvailabilityState>({
    valid: false,
    checking: false,
    available: null,
  });

  const usernameValidation = validateUsername(username);
  const canSubmitUsername =
    usernameValidation.valid && usernameState.available === true && !usernameState.checking;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!usernameValidation.valid) {
      setError('Choose a valid username.');
      return;
    }
    if (!canSubmitUsername) {
      setError('This username is not available.');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      setError('Password does not meet the requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setPending(true);
    try {
      const result = await registerAccount({
        email: email.trim(),
        username: normalizeUsername(username),
        password,
      });
      if (result.loginCodePlain) {
        setLoginCodePlain(result.loginCodePlain);
      } else {
        completeAuthSuccess(router, 'Account created');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setPending(false);
    }
  };

  if (loginCodePlain) {
    return (
      <div className="space-y-6">
        <GuestCodeReveal
          loginCodePlain={loginCodePlain}
          title="Your SoulSync login code"
          description="You can sign in with email, username, or this code plus your password. Store it safely."
        />
        <button
          type="button"
          className={cn(
            'flex h-12 w-full items-center justify-center rounded-full text-base font-semibold text-white',
            'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]',
          )}
          onClick={() => completeAuthSuccess(router, 'Account created')}
        >
          Continue to home
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <UsernameField
        value={username}
        onChange={setUsername}
        onAvailabilityChange={setUsernameState}
        disabled={pending}
      />
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrength password={password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Retype password</Label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !canSubmitUsername}
        className={cn(
          'flex h-12 w-full items-center justify-center rounded-full text-base font-semibold text-white',
          'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]',
          'transition-opacity hover:opacity-95 disabled:opacity-60',
        )}
      >
        {pending ? 'Creating account…' : 'Sign up'}
      </button>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
