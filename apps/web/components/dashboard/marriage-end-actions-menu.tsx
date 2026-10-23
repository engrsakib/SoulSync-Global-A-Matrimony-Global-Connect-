'use client';

import * as React from 'react';
import { HeartCrack, MoreHorizontal, UserX } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';

type MarriageEndActionsMenuProps = {
  disabled?: boolean;
  /** Linked SoulSync spouse — show mutual divorce request wording. */
  linkedSpouse?: boolean;
  onRequestDivorce?: () => void;
  onMarkDivorced?: () => void;
  onMarkDeceased: () => void;
  menuLabel?: string;
};

export function MarriageEndActionsMenu({
  disabled,
  linkedSpouse = false,
  onRequestDivorce,
  onMarkDivorced,
  onMarkDeceased,
  menuLabel = 'Marriage status actions',
}: MarriageEndActionsMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const closeAnd = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        disabled={disabled}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)]/80',
          'bg-[var(--background)] text-[var(--muted-foreground)] shadow-sm',
          'hover:border-[var(--color-brand-700)]/30 hover:text-[var(--foreground)]',
          'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none',
          disabled && 'pointer-events-none opacity-50',
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute top-full right-0 z-30 mt-2 w-[15.5rem] overflow-hidden rounded-xl',
            'border border-[var(--border)]/90 bg-[var(--background)]',
            'shadow-[0_10px_38px_-10px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04]',
          )}
        >
          <p className="border-b border-[var(--border)]/60 px-3.5 py-2.5 text-[11px] font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
            Update status
          </p>
          <div className="p-1.5">
            {linkedSpouse && onRequestDivorce ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--muted)]/60"
                onClick={() => closeAnd(onRequestDivorce)}
              >
                <HeartCrack
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-medium text-[var(--foreground)]">
                    Request divorce
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted-foreground)]">
                    Your spouse must confirm on SoulSync
                  </span>
                </span>
              </button>
            ) : null}
            {!linkedSpouse && onMarkDivorced ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--muted)]/60"
                onClick={() => closeAnd(onMarkDivorced)}
              >
                <HeartCrack
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-medium text-[var(--foreground)]">
                    Mark divorced
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted-foreground)]">
                    Ends this marriage on your profile
                  </span>
                </span>
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--muted)]/60"
              onClick={() => closeAnd(onMarkDeceased)}
            >
              <UserX
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
                aria-hidden
              />
              <span>
                <span className="block text-sm font-medium text-[var(--foreground)]">
                  Mark deceased
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted-foreground)]">
                  Record passing with care; history is kept
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
