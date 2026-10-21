import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@soulsync/ui/lib/utils';
import { dashboardSectionTitle } from '@/lib/ui-classes';

type DashboardCardProps = {
  title: string;
  editHref?: string;
  editLabel?: string;
  children: ReactNode;
  className?: string;
};

export function DashboardCard({
  title,
  editHref,
  editLabel = 'Edit',
  children,
  className,
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-6 shadow-sm',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className={dashboardSectionTitle}>{title}</h2>
        {editHref ? (
          <Link
            href={editHref}
            className={cn(
              'inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold text-white',
              'bg-[var(--color-brand-700)] transition-colors hover:bg-[var(--color-brand-800)]',
            )}
          >
            {editLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
