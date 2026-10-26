import type { ScrollStackHighlight } from './scroll-stack.types';

/** Theme-aware pill tones (`--highlight-pill-accent` per palette in `@soulsync/ui` styles.css). */
export const SCROLL_STACK_HIGHLIGHT_TONE_CLASS: Record<
  NonNullable<ScrollStackHighlight['tone']>,
  string
> = {
  brand:
    'border-[var(--color-brand-500)]/35 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]',
  accent:
    'border-[color-mix(in_oklab,var(--highlight-pill-accent)_40%,var(--border))] bg-[color-mix(in_oklab,var(--highlight-pill-accent)_14%,var(--muted))] text-[color-mix(in_oklab,var(--highlight-pill-accent)_72%,var(--foreground))]',
  muted: 'border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)]',
};
