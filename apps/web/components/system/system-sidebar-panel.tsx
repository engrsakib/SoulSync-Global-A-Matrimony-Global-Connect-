'use client';

import { ChevronRight } from 'lucide-react';
import type { SystemPageSidebarCardDto } from '@soulsync/shared-types';
import { cn } from '@soulsync/ui/lib/utils';
import { systemSidebarIcon } from './system-sidebar-icons';

const TONE_CLASS: Record<SystemPageSidebarCardDto['tone'], string> = {
  high: 'border-[var(--destructive)]/35 bg-[var(--destructive)]/8',
  medium: 'border-amber-500/35 bg-amber-500/10',
  low: 'border-emerald-500/30 bg-emerald-500/10',
};

type SystemSidebarPanelProps = {
  cards: SystemPageSidebarCardDto[];
  className?: string;
};

export function SystemSidebarPanel({ cards, className }: SystemSidebarPanelProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <aside
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-lg backdrop-blur-sm',
        'motion-safe:transition-shadow motion-safe:duration-300',
        className,
      )}
      aria-label="Policy highlights"
    >
      <p className="mb-4 text-xs font-bold tracking-wider text-[var(--muted-foreground)] uppercase">
        Highlights
      </p>
      <ul className="space-y-3">
        {cards.map((card) => {
          const Icon = systemSidebarIcon(card.iconKey);
          return (
            <li key={card.id}>
              <div
                className={cn(
                  'group flex gap-3 rounded-xl border p-4 transition-colors motion-safe:duration-200',
                  TONE_CLASS[card.tone],
                  'hover:border-[var(--color-brand-500)]/40',
                )}
              >
                {Icon ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--background)]/60 ring-1 ring-[var(--border)]">
                    <Icon className="h-5 w-5 text-[var(--primary)]" aria-hidden />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-wide text-[var(--muted-foreground)] uppercase">
                    {card.category}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{card.title}</p>
                  <p className="mt-1 text-sm leading-snug text-slate-300">{card.body}</p>
                </div>
                <ChevronRight
                  className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-60 group-hover:opacity-100"
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
