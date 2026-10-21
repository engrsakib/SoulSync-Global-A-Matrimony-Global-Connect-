'use client';

import * as React from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import {
  confirmChangeNewAccountEmail,
  confirmSetAccountEmail,
  requestChangeCurrentAccountEmail,
  requestChangeNewAccountEmail,
  requestSetAccountEmail,
  verifyChangeCurrentAccountEmail,
} from '@/lib/account-email-api';
import { notifyAuthSessionChanged } from '@/lib/auth-session';

const OTP_TTL_SECONDS = 300;

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const primaryButtonClass = cn(
  'inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold text-white',
  'bg-gradient-to-r from-[var(--color-brand-600)] to-blue-600',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

const secondaryButtonClass = cn(
  'inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-medium',
  'bg-[var(--background)] hover:bg-[var(--muted)]/40',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

type EmailDialogMode = 'set' | 'change';

type EmailSettingsDialogProps = {
  open: boolean;
  mode: EmailDialogMode;
  initialEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
};

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function EmailSettingsDialog({
  open,
  mode,
  initialEmail = '',
  onClose,
  onSuccess,
}: EmailSettingsDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <EmailSettingsDialogContent
      key={`${mode}:${initialEmail}`}
      mode={mode}
      initialEmail={initialEmail}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function EmailSettingsDialogContent({
  mode,
  initialEmail = '',
  onClose,
  onSuccess,
}: Omit<EmailSettingsDialogProps, 'open'>) {
  const [step, setStep] = React.useState<'email' | 'code' | 'current' | 'new-email' | 'new-code'>(
    mode === 'change' ? 'current' : 'email',
  );
  const [email, setEmail] = React.useState(initialEmail);
  const [newEmail, setNewEmail] = React.useState('');
  const [code, setCode] = React.useState('');
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

  React.useEffect(() => {
    if (mode !== 'change' || step !== 'current') {
      return;
    }
    let cancelled = false;
    void (async () => {
      setPending(true);
      setError(null);
      try {
        await requestChangeCurrentAccountEmail();
        if (!cancelled) {
          setExpiresIn(OTP_TTL_SECONDS);
          toast.message('We sent a code to your current email');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not send code');
        }
      } finally {
        if (!cancelled) {
          setPending(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, step]);

  const startCountdown = () => setExpiresIn(OTP_TTL_SECONDS);

  const handleSendSetCode = async () => {
    setError(null);
    setPending(true);
    try {
      await requestSetAccountEmail(email.trim());
      startCountdown();
      setStep('code');
      toast.message('Check your inbox for the verification code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setPending(false);
    }
  };

  const handleConfirmSet = async () => {
    setError(null);
    setPending(true);
    try {
      await confirmSetAccountEmail(email.trim(), code.trim());
      toast.success('Email verified and saved');
      notifyAuthSessionChanged();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify code');
    } finally {
      setPending(false);
    }
  };

  const handleVerifyCurrent = async () => {
    setError(null);
    setPending(true);
    try {
      await verifyChangeCurrentAccountEmail(code.trim());
      setCode('');
      setStep('new-email');
      toast.success('Current email verified');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect code');
    } finally {
      setPending(false);
    }
  };

  const handleSendNewCode = async () => {
    setError(null);
    setPending(true);
    try {
      await requestChangeNewAccountEmail(newEmail.trim());
      startCountdown();
      setStep('new-code');
      toast.message('Code sent to your new email address');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setPending(false);
    }
  };

  const handleConfirmChange = async () => {
    setError(null);
    setPending(true);
    try {
      await confirmChangeNewAccountEmail(newEmail.trim(), code.trim());
      toast.success('Email updated');
      notifyAuthSessionChanged();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify code');
    } finally {
      setPending(false);
    }
  };

  const title =
    mode === 'change' ? 'Change email' : initialEmail ? 'Verify email' : 'Set email address';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-dialog-title"
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="email-dialog-title" className="text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          We use a 6-digit code that expires in 5 minutes. Check your spam folder if you do not see
          it.
        </p>

        <div className="mt-5 space-y-4">
          {step === 'email' ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={pending || !email.trim()}
                onClick={() => {
                  void handleSendSetCode();
                }}
              >
                {pending ? 'Sending…' : 'Send verification code'}
              </button>
            </>
          ) : null}

          {step === 'code' ? (
            <>
              <p className="text-sm text-[var(--muted-foreground)]">
                Code sent to <span className="font-medium text-[var(--foreground)]">{email}</span>
                {expiresIn > 0 ? (
                  <>
                    {' '}
                    · expires in{' '}
                    <span className="font-medium tabular-nums">{formatCountdown(expiresIn)}</span>
                  </>
                ) : null}
              </p>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Verification code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className={cn(inputClass, 'text-center font-mono text-lg tracking-[0.3em]')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={primaryButtonClass}
                  disabled={pending || code.length !== 6}
                  onClick={() => {
                    void handleConfirmSet();
                  }}
                >
                  {pending ? 'Verifying…' : 'Confirm email'}
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={pending}
                  onClick={() => {
                    setStep('email');
                    setCode('');
                  }}
                >
                  Back
                </button>
              </div>
            </>
          ) : null}

          {step === 'current' ? (
            <>
              <p className="text-sm text-[var(--muted-foreground)]">
                Enter the code we sent to your current email address.
                {expiresIn > 0 ? (
                  <>
                    {' '}
                    Expires in{' '}
                    <span className="font-medium tabular-nums">{formatCountdown(expiresIn)}</span>
                  </>
                ) : null}
              </p>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Current email code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className={cn(inputClass, 'text-center font-mono text-lg tracking-[0.3em]')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </label>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={pending || code.length !== 6}
                onClick={() => {
                  void handleVerifyCurrent();
                }}
              >
                {pending ? 'Verifying…' : 'Continue'}
              </button>
            </>
          ) : null}

          {step === 'new-email' ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium">New email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </label>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={pending || !newEmail.trim()}
                onClick={() => {
                  void handleSendNewCode();
                }}
              >
                {pending ? 'Sending…' : 'Send code to new email'}
              </button>
            </>
          ) : null}

          {step === 'new-code' ? (
            <>
              <p className="text-sm text-[var(--muted-foreground)]">
                Enter the code sent to{' '}
                <span className="font-medium text-[var(--foreground)]">{newEmail}</span>
              </p>
              <label className="block space-y-2">
                <span className="text-sm font-medium">New email code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={cn(inputClass, 'text-center font-mono text-lg tracking-[0.3em]')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </label>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={pending || code.length !== 6}
                onClick={() => {
                  void handleConfirmChange();
                }}
              >
                {pending ? 'Saving…' : 'Save new email'}
              </button>
            </>
          ) : null}

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          className="mt-6 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
