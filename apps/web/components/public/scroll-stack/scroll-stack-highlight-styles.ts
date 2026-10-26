import type { ScrollStackHighlight } from './scroll-stack.types';

export const SCROLL_STACK_HIGHLIGHT_TONE_CLASS: Record<
  NonNullable<ScrollStackHighlight['tone']>,
  string
> = {
  brand:
    'border-[var(--color-brand-500)]/35 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]',
  accent:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  muted: 'border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)]',
};
