'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validatePassword } from '@soulsync/shared-types';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import { VerificationCodeInput } from '@/components/auth/verification-code-input';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import {
  confirmPasswordReset,
  requestPasswordReset,
  verifyPasswordResetCode,
} from '@/lib/password-reset-api';

const OTP_TTL_SECONDS = 300;

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const primaryButtonClass = cn(
  'flex h-12 w-full items-center justify-center rounded-full text-base font-semibold text-white',
  'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)]',
  'transition-opacity hover:opacity-95 disabled:opacity-60',
);

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Step = 'email' | 'code' | 'password';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>('email');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [expiresIn, setExpiresIn] = React.useState(0);

  React.useEffect(() => {
    if (expiresIn <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setExpiresIn((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresIn]);

  const expired = expiresIn <= 0;
  const passwordValid = validatePassword(newPassword).valid;
  const canConfirmPassword =
    passwordValid && newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSendCode = async () => {
    setError(null);
    setPending(true);
    try {
      await requestPasswordReset(email.trim());
      setExpiresIn(OTP_TTL_SECONDS);
      setCode('');
      setStep('code');
      toast.message('If an account exists, check your inbox for the code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setPending(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setPending(true);
    try {
      await requestPasswordReset(email.trim());
      setExpiresIn(OTP_TTL_SECONDS);
      setCode('');
      toast.message('Verification code sent again');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setPending(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    setPending(true);
    try {
      await verifyPasswordResetCode(email.trim(), code.trim());
      setStep('password');
      toast.success('Code verified');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect code');
    } finally {
      setPending(false);
    }
  };

  const handleConfirmPassword = async () => {
    setError(null);
    setPending(true);
    try {
      await confirmPasswordReset(email.trim(), newPassword, confirmPassword);
      toast.success('Password updated. You can log in now.');
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'email' ? (
        <>
          <p className="text-sm text-[var(--muted-foreground)]">
            Enter your email. We&apos;ll send a 6-digit code that expires in 5 minutes.
          </p>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={pending || !email.trim()}
            onClick={() => void handleSendCode()}
          >
            {pending ? 'Sending…' : 'Send verification code'}
          </button>
        </>
      ) : null}

      {step === 'code' ? (
        <>
          <p className="text-sm text-[var(--muted-foreground)]">
            Enter the code we sent to <span className="font-medium text-[var(--foreground)]">{email.trim()}</span>
            {expiresIn > 0 ? (
              <>
                . <span className="tabular-nums">Expires in {formatCountdown(expiresIn)}</span>
              </>
            ) : null}
          </p>
          <VerificationCodeInput
            id="password-reset-code"
            value={code}
            onChange={setCode}
            disabled={pending}
          />
          <button
            type="button"
            className={primaryButtonClass}
            disabled={pending || (!expired && code.length !== 6)}
            onClick={() => void (expired ? handleResendCode() : handleVerifyCode())}
          >
            {pending ? 'Please wait…' : expired ? 'Resend email' : 'Continue'}
          </button>
        </>
      ) : null}

      {step === 'password' ? (
        <>
          <p className="text-sm text-[var(--muted-foreground)]">
            Choose a strong password for <span className="font-medium text-[var(--foreground)]">{email.trim()}</span>.
          </p>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={setNewPassword}
              disabled={pending}
            />
            <PasswordStrength password={newPassword} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirm password</Label>
            <PasswordInput
              id="confirm-new-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={pending}
            />
          </div>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={pending || !canConfirmPassword}
            onClick={() => void handleConfirmPassword()}
          >
            {pending ? 'Saving…' : 'Reset password'}
          </button>
        </>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
