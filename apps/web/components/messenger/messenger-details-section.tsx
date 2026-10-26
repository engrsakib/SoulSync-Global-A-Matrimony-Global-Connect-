'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function MessengerDetailsSection({
  title,
  defaultOpen = true,
  children,
  className,
}: Props) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section className={cn('border-b border-[var(--border)] py-3', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-[var(--foreground)]">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open ? <div className="mt-3 space-y-3">{children}</div> : null}
    </section>
  );
}
