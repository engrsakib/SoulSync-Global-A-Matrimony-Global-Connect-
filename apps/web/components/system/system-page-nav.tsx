import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';

type SystemPageNavProps = {
  prevSlug: string | null;
  nextSlug: string | null;
  prevTitle?: string;
  nextTitle?: string;
};

function navHref(slug: string): string {
  return `/system/${slug}`;
}

export function SystemPageNav({ prevSlug, nextSlug }: SystemPageNavProps) {
  return (
    <nav
      className="mt-12 flex flex-col gap-3 border-t border-[var(--border)] pt-8 sm:flex-row sm:items-stretch sm:justify-between"
      aria-label="Policy pages"
    >
      {prevSlug ? (
        <Link
          href={navHref(prevSlug)}
          className={cn(
            'inline-flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[var(--border)]',
            'bg-[var(--card)]/80 px-4 py-3 text-sm font-semibold text-slate-300',
            'transition-colors hover:border-[var(--color-brand-500)]/40 hover:text-[var(--foreground)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          )}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          Previous
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}

      {nextSlug ? (
        <Link
          href={navHref(nextSlug)}
          className={cn(
            'inline-flex min-h-11 flex-1 items-center justify-end gap-2 rounded-xl border border-[var(--border)]',
            'bg-[var(--card)]/80 px-4 py-3 text-sm font-semibold text-slate-300 sm:text-right',
            'transition-colors hover:border-[var(--color-brand-500)]/40 hover:text-[var(--foreground)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          )}
        >
          Next
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
