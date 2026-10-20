'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import {
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  validateUsername,
} from '@soulsync/shared-types';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { checkUsernameAvailableForAccount } from '@/lib/account-api';
import { checkUsernameAvailable } from '@/lib/auth-api';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white py-2 pl-3 pr-10 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

function sanitizeUsernameInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, USERNAME_MAX_LENGTH);
}

export type UsernameAvailabilityState = {
  valid: boolean;
  checking: boolean;
  available: boolean | null;
};

type UsernameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onAvailabilityChange?: (state: UsernameAvailabilityState) => void;
  disabled?: boolean;
  /** Logged-in profile: availability via account BFF and unchanged username stays valid. */
  forAccount?: boolean;
  currentUsername?: string | null;
  required?: boolean;
};

export function UsernameField({
  value,
  onChange,
  onAvailabilityChange,
  disabled,
  forAccount,
  currentUsername,
  required = true,
}: UsernameFieldProps) {
  const validation = validateUsername(value);
  const normalized = normalizeUsername(value);
  const isUnchangedAccountUsername =
    forAccount &&
    !!currentUsername &&
    validation.valid &&
    normalized === normalizeUsername(currentUsername);

  const [apiResult, setApiResult] = React.useState<{
    forValue: string;
    available: boolean | null;
  }>({ forValue: '', available: null });
  const requestIdRef = React.useRef(0);

  const needsApiCheck = validation.valid && !isUnchangedAccountUsername;
  const checking = needsApiCheck && apiResult.forValue !== value;
  const available = !validation.valid
    ? null
    : isUnchangedAccountUsername
      ? true
      : apiResult.forValue === value
        ? apiResult.available
        : null;

  const availabilitySnapshot = React.useMemo(
    () => ({
      valid: validation.valid,
      checking,
      available,
    }),
    [validation.valid, checking, available],
  );

  React.useEffect(() => {
    onAvailabilityChange?.(availabilitySnapshot);
  }, [availabilitySnapshot, onAvailabilityChange]);

  React.useEffect(() => {
    if (!needsApiCheck) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const checkAvailability = forAccount
      ? checkUsernameAvailableForAccount
      : checkUsernameAvailable;

    const timer = window.setTimeout(() => {
      checkAvailability(value)
        .then((result) => {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setApiResult({ forValue: value, available: result.available });
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setApiResult({ forValue: value, available: null });
        });
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, needsApiCheck, forAccount]);

  const showAvailableIcon = value.length > 0 && !checking && validation.valid && available === true;
  const showUnavailableIcon =
    value.length > 0 && !checking && (!validation.valid || available === false);

  const checklist = [
    { key: 'startsWithLetter' as const, label: 'Starts with a letter (a–z)' },
    {
      key: 'minLength' as const,
      label: `${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters`,
    },
    { key: 'allowedChars' as const, label: 'Letters, numbers, underscores only' },
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="username">Username</Label>
      <div className="relative">
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required={required}
          maxLength={USERNAME_MAX_LENGTH}
          disabled={disabled}
          className={inputClass}
          value={value}
          onChange={(e) => onChange(sanitizeUsernameInput(e.target.value))}
          aria-describedby="username-hint username-status"
          aria-invalid={showUnavailableIcon || undefined}
        />
        {showAvailableIcon ? (
          <span
            className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center text-emerald-600"
            aria-hidden
          >
            <Check className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          </span>
        ) : null}
        {showUnavailableIcon ? (
          <span
            className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center text-red-600"
            aria-hidden
          >
            <X className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          </span>
        ) : null}
      </div>
      {value.length > 0 && !validation.valid ? (
        <ul id="username-hint" className="space-y-1 text-xs text-[var(--muted-foreground)]">
          {checklist.map((item) => (
            <li
              key={item.key}
              className={cn(
                'flex items-center gap-2',
                validation.checks[item.key] && 'text-[var(--foreground)]',
              )}
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  validation.checks[item.key] ? 'bg-emerald-500' : 'bg-[var(--border)]',
                )}
                aria-hidden
              />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}
      {validation.valid ? (
        <p id="username-status" className="sr-only" aria-live="polite">
          {checking
            ? 'Checking availability'
            : available === true
              ? 'Username is available'
              : available === false
                ? 'Username is already taken'
                : ''}
        </p>
      ) : null}
    </div>
  );
}
