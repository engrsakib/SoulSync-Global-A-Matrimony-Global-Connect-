import type { LucideIcon } from 'lucide-react';
import type { AboutPageMilestoneItemDto } from '@soulsync/shared-types/about-page';
import { cn } from '@soulsync/ui/lib/utils';

export type MilestoneRoadmapCardProps = {
  item: AboutPageMilestoneItemDto;
  isActive: boolean;
  Icon: LucideIcon;
};

export function MilestoneRoadmapCard({ item, isActive, Icon }: MilestoneRoadmapCardProps) {
  return (
    <article
      className={cn(
        'relative rounded-2xl border p-6 pt-8 shadow-sm sm:p-7 sm:pt-9',
        isActive
          ? [
              'border-[color-mix(in_oklab,var(--color-brand-500)_45%,var(--border))]',
              'bg-gradient-to-br from-[var(--color-brand-600)] via-[var(--color-brand-700)] to-[var(--color-brand-800)]',
              'shadow-[0_16px_40px_-20px_color-mix(in_srgb,var(--color-brand-700)_50%,transparent)]',
            ]
          : [
              'border-[var(--border)] bg-[var(--card)]',
              'shadow-[0_8px_24px_-16px_color-mix(in_srgb,var(--foreground)_12%,transparent)]',
            ],
      )}
    >
      <div
        className={cn(
          'absolute -top-5 -left-2 flex h-12 w-12 items-center justify-center rounded-xl sm:-left-3',
          'ring-[3px] shadow-sm',
          isActive
            ? 'bg-[color-mix(in_oklab,var(--primary-foreground)_22%,transparent)] ring-[color-mix(in_oklab,var(--primary-foreground)_38%,transparent)]'
            : 'bg-[var(--card)] ring-[var(--border)] shadow-[0_4px_14px_-6px_color-mix(in_srgb,var(--foreground)_18%,transparent)]',
        )}
        aria-hidden
      >
        <Icon
          className={cn(
            'h-6 w-6',
            isActive ? 'text-[var(--primary-foreground)]' : 'text-[var(--primary)]',
          )}
          strokeWidth={2.25}
          aria-hidden
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          className={cn(
            'min-w-0 flex-1 text-lg font-bold tracking-tight sm:text-xl',
            isActive ? 'text-[var(--primary-foreground)]' : 'text-[var(--card-foreground)]',
          )}
        >
          {item.title}
        </h3>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase sm:text-xs',
            isActive
              ? 'bg-[color-mix(in_oklab,var(--primary-foreground)_18%,transparent)] text-[var(--primary-foreground)] ring-1 ring-[color-mix(in_oklab,var(--primary-foreground)_28%,transparent)]'
              : 'bg-[var(--muted)] text-[var(--muted-foreground)] ring-1 ring-[var(--border)]',
          )}
        >
          {item.period}
        </span>
      </div>

      <p
        className={cn(
          'mt-3 text-sm leading-relaxed sm:text-base',
          isActive
            ? 'text-[color-mix(in_oklab,var(--primary-foreground)_92%,transparent)]'
            : 'text-[var(--muted-foreground)]',
        )}
      >
        {item.body}
      </p>

      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px',
          isActive
            ? 'bg-[color-mix(in_oklab,var(--primary-foreground)_35%,transparent)]'
            : 'bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]',
        )}
        aria-hidden
      />
    </article>
  );
}
