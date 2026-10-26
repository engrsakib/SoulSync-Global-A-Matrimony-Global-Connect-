import { cn } from '@soulsync/ui/lib/utils';

export const marketingSectionInnerClass = 'max-w-none lg:w-full lg:max-w-[80rem]';

export const marketingSectionSurfaceClass = 'bg-[var(--muted)]/25';

export const marketingCardClass = cn(
  'h-full rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 shadow-sm backdrop-blur-sm',
);

export const marketingFeaturedCardClass = cn(
  marketingCardClass,
  'overflow-hidden border-[color-mix(in_oklab,var(--color-brand-500)_40%,var(--border))]',
);

export const marketingIconTileClass = cn(
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
  'bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] text-white shadow-sm',
);

export const marketingBrandHairlineClass =
  'h-1 shrink-0 bg-gradient-to-r from-[var(--color-brand-500)] via-[var(--color-brand-600)] to-[var(--color-brand-800)]';
