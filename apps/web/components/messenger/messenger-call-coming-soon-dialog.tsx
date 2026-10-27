'use client';

import * as React from 'react';
import { Phone, Sparkles, Video, X } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';

export type MessengerCallComingSoonKind = 'audio' | 'video';

type Props = {
  kind: MessengerCallComingSoonKind;
  peerName: string;
  onClose: () => void;
};

const COPY: Record<
  MessengerCallComingSoonKind,
  { title: string; lead: string; icon: typeof Phone }
> = {
  audio: {
    title: 'Voice calls',
    lead: 'Crystal-clear encrypted voice calls with your matches are on the way.',
    icon: Phone,
  },
  video: {
    title: 'Video calls',
    lead: 'Face-to-face conversations—private and built for SoulSync—are almost here.',
    icon: Video,
  },
};

export function MessengerCallComingSoonDialog({ kind, peerName, onClose }: Props) {
  const meta = COPY[kind];
  const Icon = meta.icon;

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="messenger-coming-soon-title"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--color-brand-700)]/25 to-transparent"
          aria-hidden
        />
        <div className="relative p-6 pt-8 text-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] text-white shadow-lg ring-4 ring-[var(--color-brand-700)]/20">
            <Icon className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-brand-600)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Coming soon
          </p>
          <h2
            id="messenger-coming-soon-title"
            className="mt-3 text-lg font-semibold text-[var(--foreground)]"
          >
            {meta.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{meta.lead}</p>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            You will be able to call{' '}
            <span className="font-medium text-[var(--foreground)]">{peerName}</span> right from this
            chat—as soon as our team finishes the rollout.
          </p>
          <button
            type="button"
            className={cn(
              'mt-6 w-full rounded-xl bg-[var(--color-brand-700)] px-4 py-2.5 text-sm font-semibold text-white',
              'transition hover:bg-[var(--color-brand-800)]',
            )}
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
