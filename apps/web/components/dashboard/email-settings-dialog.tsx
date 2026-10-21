'use client';

import * as React from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import { VerificationCodeInput } from '@/components/auth/verification-code-input';
import {
  confirmChangeNewAccountEmail,
  confirmSetAccountEmail,
  requestChangeCurrentAccountEmail,
  requestChangeNewAccountEmail,
  requestSetAccountEmail,
  verifyChangeCurrentAccountEmail,
} from '@/lib/account-email-api';
import { notifyAuthSessionChanged } from '@/lib/auth-session';
import { btnPrimaryLg } from '@/lib/ui-classes';

const OTP_TTL_SECONDS = 300;

const inputClass = cn(
  'flex h-12 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const primaryButtonClass = cn(btnPrimaryLg, 'transition-opacity hover:opacity-95');

type EmailDialogMode = 'set' | 'change';

type EmailSettingsDialogProps = {
  open: boolean;
  mode: EmailDialogMode;
  initialEmail?: string;
  /** Verified current email (change flow — current step subcopy). */
  currentEmail?: string;
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
  currentEmail,
  onClose,
  onSuccess,
}: EmailSettingsDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <EmailSettingsDialogContent
      key={`${mode}:${initialEmail}:${currentEmail ?? ''}`}
      mode={mode}
      initialEmail={initialEmail}
      currentEmail={currentEmail}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function EmailSettingsDialogContent({
  mode,
  initialEmail = '',
  currentEmail,
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

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
      setCode('');
      setStep('code');
      toast.message('Check your inbox for the verification code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setPending(false);
    }
  };

  const handleResendSetCode = async () => {
    setError(null);
    setPending(true);
    try {
      await requestSetAccountEmail(email.trim());
      startCountdown();
      setCode('');
      toast.message('Verification code sent again');
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

  const handleResendCurrentCode = async () => {
    setError(null);
    setPending(true);
    try {
      await requestChangeCurrentAccountEmail();
      startCountdown();
      setCode('');
      toast.message('Verification code sent again');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
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
      setCode('');
      setStep('new-code');
      toast.message('Code sent to your new email address');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setPending(false);
    }
  };

  const handleResendNewCode = async () => {
    setError(null);
    setPending(true);
    try {
      await requestChangeNewAccountEmail(newEmail.trim());
      startCountdown();
      setCode('');
      toast.message('Verification code sent again');
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

  const expired = expiresIn === 0;

  const titleForStep = (): string => {
    if (step === 'code' || step === 'current' || step === 'new-code') {
      return "Confirm it's you";
    }
    if (step === 'new-email') {
      return 'New email address';
    }
    return mode === 'change' ? 'Change email' : initialEmail ? 'Verify email' : 'Set email address';
  };

  const codeSubcopy = (targetEmail: string | undefined, fallback: string) => (
    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
      We sent a temporary verification code to{' '}
      {targetEmail ? (
        <span className="font-medium text-[var(--foreground)]">{targetEmail}</span>
      ) : (
        fallback
      )}
      {expiresIn > 0 ? (
        <>
          . <span className="tabular-nums">Expires in {formatCountdown(expiresIn)}</span>
        </>
      ) : null}
    </p>
  );

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
        className="w-full max-w-md rounded-2xl border border-[var(--border)]/60 bg-[var(--background)] p-8 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="email-dialog-title"
          className="text-2xl font-bold tracking-tight text-[var(--foreground)]"
        >
          {titleForStep()}
        </h2>

        <div className="mt-6 space-y-6">
          {step === 'email' ? (
            <>
              <p className="text-sm text-[var(--muted-foreground)]">
                Enter your email. We&apos;ll send a 6-digit code that expires in 5 minutes.
              </p>
              <label className="block space-y-2">
                <span className="sr-only">Email address</span>
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
              {codeSubcopy(email.trim(), 'your email')}
              <VerificationCodeInput
                id="email-set-code"
                aria-labelledby="email-dialog-title"
                value={code}
                onChange={setCode}
                disabled={pending}
              />
              <button
                type="button"
                className={primaryButtonClass}
                disabled={pending || (!expired && code.length !== 6)}
                onClick={() => {
                  void (expired ? handleResendSetCode() : handleConfirmSet());
                }}
              >
                {pending ? 'Please wait…' : expired ? 'Resend email' : 'Confirm email'}
              </button>
            </>
          ) : null}

          {step === 'current' ? (
            <>
              {codeSubcopy(currentEmail, 'your current email address')}
              <VerificationCodeInput
                id="email-current-code"
                aria-labelledby="email-dialog-title"
                value={code}
                onChange={setCode}
                disabled={pending}
              />
              <button
                type="button"
                className={primaryButtonClass}
                disabled={pending || (!expired && code.length !== 6)}
                onClick={() => {
                  void (expired ? handleResendCurrentCode() : handleVerifyCurrent());
                }}
              >
                {pending ? 'Please wait…' : expired ? 'Resend email' : 'Continue'}
              </button>
            </>
          ) : null}

          {step === 'new-email' ? (
            <>
              <p className="text-sm text-[var(--muted-foreground)]">
                Enter the new address. We&apos;ll email a verification code there.
              </p>
              <label className="block space-y-2">
                <span className="sr-only">New email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="you@example.com"
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
                {pending ? 'Sending…' : 'Send verification code'}
              </button>
            </>
          ) : null}

          {step === 'new-code' ? (
            <>
              {codeSubcopy(newEmail.trim(), 'your new email')}
              <VerificationCodeInput
                id="email-new-code"
                aria-labelledby="email-dialog-title"
                value={code}
                onChange={setCode}
                disabled={pending}
              />
              <button
                type="button"
                className={primaryButtonClass}
                disabled={pending || (!expired && code.length !== 6)}
                onClick={() => {
                  void (expired ? handleResendNewCode() : handleConfirmChange());
                }}
              >
                {pending ? 'Please wait…' : expired ? 'Resend email' : 'Save new email'}
              </button>
            </>
          ) : null}

          {error ? (
            <p className="text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
