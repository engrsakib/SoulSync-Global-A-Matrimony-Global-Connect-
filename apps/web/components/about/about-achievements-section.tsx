import { cn } from '@soulsync/ui/lib/utils';
import type { AboutPageAchievementsSectionDto } from '@soulsync/shared-types/about-page';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { PublicSectionShell } from '@/components/public/public-section-shell';

type AboutAchievementsSectionProps = AboutPageAchievementsSectionDto;

export function AboutAchievementsSection({
  badge,
  title,
  description,
  items,
}: AboutAchievementsSectionProps) {
  return (
    <PublicSectionShell borderTop>
      <div className="space-y-10">
        <PublicSectionHeader badge={badge} title={title} description={description} />
        <ol className="relative mx-auto max-w-3xl space-y-0">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.id} className="relative flex gap-4 pb-10 sm:gap-6 sm:pb-12">
                {!isLast ? (
                  <span
                    className="absolute top-10 left-[1.125rem] hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-[var(--color-brand-500)]/50 to-[var(--border)] sm:block"
                    aria-hidden
                  />
                ) : null}
                <div className="relative z-10 shrink-0">
                  <span
                    className={cn(
                      'flex min-h-9 min-w-[4.5rem] items-center justify-center rounded-full px-3 py-1',
                      'bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)]',
                      'text-xs font-bold tracking-wide text-white shadow-sm sm:min-w-[5rem] sm:text-sm',
                    )}
                  >
                    {item.period}
                  </span>
                </div>
                <div
                  className={cn(
                    'min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm',
                    'sm:p-6',
                  )}
                >
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
                    {item.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </PublicSectionShell>
  );
}
