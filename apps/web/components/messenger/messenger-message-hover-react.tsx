'use client';

import { Smile } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';

type Props = {
  mine: boolean;
  open: boolean;
  onClick: () => void;
};

export function MessengerMessageHoverReact({ mine, open, onClick }: Props) {
  return (
    <button
      type="button"
      aria-label="React to message"
      aria-expanded={open}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        'absolute z-10 flex h-8 w-8 items-center justify-center rounded-full',
        'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-md',
        'opacity-0 transition-opacity group-hover/msg:opacity-100',
        'hover:bg-[var(--muted)]',
        'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]',
        open && 'opacity-100 ring-2 ring-[var(--color-brand-600)]/40',
        mine
          ? 'left-0 top-1/2 -translate-x-[calc(100%+6px)] -translate-y-1/2'
          : 'right-0 top-1/2 translate-x-[calc(100%+6px)] -translate-y-1/2',
      )}
    >
      <Smile className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
