import { cn } from '@soulsync/ui/lib/utils';

/** Solid green primary button (site-wide). */
export const btnPrimary = cn(
  'inline-flex items-center justify-center rounded-full font-semibold text-white',
  'bg-[var(--color-brand-700)] transition-colors hover:bg-[var(--color-brand-800)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export const btnPrimaryMd = cn(btnPrimary, 'h-10 px-5 text-sm');

export const btnPrimaryLg = cn(btnPrimary, 'h-12 w-full text-base');

export const btnPrimaryOutline = cn(
  'inline-flex items-center justify-center rounded-full border font-semibold',
  'border-[var(--color-brand-700)] bg-white text-[var(--color-brand-700)]',
  'transition-colors hover:bg-[var(--color-brand-50)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export const textBrandGradient = cn(
  'bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)] bg-clip-text text-transparent',
);

export const bgBrandSolid = 'bg-[var(--color-brand-700)]';

export const bgBrandGradient = cn(
  'bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)]',
);

export const dashboardSectionTitle = 'text-lg font-semibold text-[var(--color-brand-700)]';

export const dashboardPageTitle = 'text-2xl font-bold tracking-tight text-[var(--color-brand-700)]';
