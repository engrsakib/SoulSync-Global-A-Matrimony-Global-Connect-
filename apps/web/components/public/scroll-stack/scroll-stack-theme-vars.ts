import type { CSSProperties } from 'react';

/** Scoped on the isometric scene root; inherits palette from html[data-theme]. */
export const STACK_THEME_CSS_PROPERTIES: CSSProperties = {
  ['--stack-active-top-from' as string]:
    'color-mix(in oklch, var(--color-brand-600) 70%, var(--primary))',
  ['--stack-active-top-via' as string]: 'var(--primary)',
  ['--stack-active-top-to' as string]: 'var(--color-brand-800)',
  ['--stack-active-front' as string]:
    'color-mix(in oklch, var(--color-brand-800) 85%, black)',
  ['--stack-active-front-mid' as string]:
    'color-mix(in oklch, var(--color-brand-800) 70%, var(--color-brand-700))',
  ['--stack-active-border' as string]:
    'color-mix(in oklch, var(--primary) 40%, var(--border))',
  ['--stack-active-glass-bg' as string]:
    'color-mix(in oklch, var(--primary-foreground) 16%, transparent)',
  ['--stack-active-glass-ring' as string]:
    'color-mix(in oklch, var(--primary-foreground) 28%, transparent)',
  ['--stack-active-glass-highlight' as string]:
    'color-mix(in oklch, var(--primary-foreground) 38%, transparent)',
  ['--stack-active-icon' as string]: 'var(--primary-foreground)',
  ['--stack-active-shadow' as string]:
    'color-mix(in srgb, var(--color-brand-700) 45%, transparent)',
  ['--stack-inactive-top-from' as string]: 'var(--card)',
  ['--stack-inactive-top-to' as string]: 'var(--muted)',
  ['--stack-inactive-front' as string]:
    'color-mix(in oklch, var(--muted) 80%, var(--card))',
  ['--stack-inactive-border' as string]: 'var(--border)',
  ['--stack-inactive-label' as string]:
    'color-mix(in oklch, var(--foreground) 72%, transparent)',
  ['--stack-inactive-highlight' as string]:
    'color-mix(in oklch, var(--foreground) 8%, transparent)',
  ['--stack-inactive-lip' as string]:
    'color-mix(in oklch, var(--foreground) 6%, transparent)',
  ['--stack-ghost-surface' as string]:
    'color-mix(in oklch, var(--card) 55%, transparent)',
  ['--stack-ghost-border' as string]:
    'color-mix(in oklch, var(--border) 65%, transparent)',
  ['--stack-ghost-icon' as string]:
    'color-mix(in oklch, var(--muted-foreground) 75%, transparent)',
  ['--stack-shadow' as string]:
    'color-mix(in srgb, var(--foreground) 14%, transparent)',
};
