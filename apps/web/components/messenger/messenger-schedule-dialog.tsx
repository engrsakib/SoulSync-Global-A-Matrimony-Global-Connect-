'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { btnPrimaryLg, formControlClass } from '@/lib/ui-classes';

const DEFAULT_MAX_DAYS = 30;

type Props = {
  onClose: () => void;
  onConfirm: (scheduledAtIso: string) => Promise<void>;
  busy?: boolean;
  title?: string;
  initialScheduledAt?: string | null;
  maxDays?: number;
};

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultScheduledLocalValue(initialScheduledAt?: string | null): string {
  if (initialScheduledAt) {
    const d = new Date(initialScheduledAt);
    if (!Number.isNaN(d.getTime())) {
      return toDatetimeLocalValue(d);
    }
  }
  return toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));
}

export function MessengerScheduleDialog({
  onClose,
  onConfirm,
  busy = false,
  title = 'Schedule message',
  initialScheduledAt,
  maxDays = DEFAULT_MAX_DAYS,
}: Props) {
  const [value, setValue] = React.useState(() => defaultScheduledLocalValue(initialScheduledAt));
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const when = new Date(value);
    const nowMs = Date.now();
    const maxMs = nowMs + maxDays * 24 * 60 * 60 * 1000;
    if (Number.isNaN(when.getTime())) {
      setError('Pick a valid date and time.');
      return;
    }
    if (when.getTime() <= nowMs) {
      setError('Scheduled time must be in the future.');
      return;
    }
    if (when.getTime() > maxMs) {
      setError(`You can schedule up to ${maxDays} days ahead.`);
      return;
    }
    try {
      await onConfirm(when.toISOString());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not schedule message');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-labelledby="messenger-schedule-title"
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="messenger-schedule-title" className="text-base font-semibold text-[var(--foreground)]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              The message stays encrypted on the server until it sends from this device.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={onClose}
            disabled={busy}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Send at
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={cn(formControlClass, 'mt-1 w-full')}
              disabled={busy}
            />
          </label>
          {error ? (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-slate-300"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimaryLg} disabled={busy || !value}>
              {busy ? 'Saving…' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
