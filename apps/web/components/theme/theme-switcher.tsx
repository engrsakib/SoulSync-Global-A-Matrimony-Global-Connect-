'use client';

import * as React from 'react';
import {
  Check,
  Leaf,
  Monitor,
  Moon,
  Palette,
  Smartphone,
  Sun,
  Waves,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@soulsync/ui/popover';
import { cn } from '@soulsync/ui/lib/utils';
import {
  THEME_PREFERENCE_META,
  type ThemePreference,
} from '@soulsync/shared-types/theme';
import { useThemeController } from '@/hooks/use-theme-controller';

const ICONS: Record<ThemePreference, React.ReactNode> = {
  light: <Sun className="h-4 w-4" aria-hidden />,
  dark: <Moon className="h-4 w-4" aria-hidden />,
  system: <Monitor className="h-4 w-4" aria-hidden />,
  'cool-slate': <Waves className="h-4 w-4" aria-hidden />,
  sepia: <Palette className="h-4 w-4" aria-hidden />,
  amoled: <Smartphone className="h-4 w-4" aria-hidden />,
  'sage-nature': <Leaf className="h-4 w-4" aria-hidden />,
};

type ThemeSwitcherProps = {
  variant?: 'compact' | 'sidebar';
  overHero?: boolean;
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function ThemeSwitcher({
  variant = 'compact',
  overHero = false,
  collapsed = false,
  className,
  onNavigate,
}: ThemeSwitcherProps) {
  const { preference, setTheme } = useThemeController();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<ThemePreference | null>(null);

  const activeMeta = THEME_PREFERENCE_META.find((item) => item.id === preference);

  const onSelect = async (next: ThemePreference) => {
    if (next === preference) {
      setOpen(false);
      onNavigate?.();
      return;
    }
    setPending(next);
    try {
      await setTheme(next);
    } finally {
      setPending(null);
      setOpen(false);
      onNavigate?.();
    }
  };

  const triggerCompact = (
    <button
      type="button"
      aria-label="Choose theme"
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-xl transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
        overHero
          ? 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25'
          : 'bg-[var(--muted)]/80 text-[var(--foreground)] shadow-sm hover:bg-[var(--muted)]',
        className,
      )}
    >
      {ICONS[preference]}
    </button>
  );

  const triggerSidebar = collapsed ? (
    <button
      type="button"
      title={`Theme: ${activeMeta?.label ?? 'Light'}`}
      aria-label={`Choose theme (${activeMeta?.label ?? 'Light'})`}
      className={cn(
        'mx-auto inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)]',
        'text-[var(--foreground)] hover:bg-[var(--muted)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        className,
      )}
    >
      {ICONS[preference]}
    </button>
  ) : (
    <button
      type="button"
      aria-label="Choose theme"
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-left text-sm',
        'text-[var(--foreground)] hover:bg-[var(--muted)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        className,
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]"
        aria-hidden
      >
        {ICONS[preference]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">Theme</span>
        <span className="block truncate text-xs text-[var(--muted-foreground)]">
          {activeMeta?.label ?? 'Light'}
        </span>
      </span>
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{variant === 'sidebar' ? triggerSidebar : triggerCompact}</PopoverTrigger>
      <PopoverContent align={variant === 'sidebar' ? 'start' : 'end'} className="w-72 p-2">
        <p className="px-2 py-1.5 text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
          Appearance
        </p>
        <ul className="flex flex-col gap-0.5" role="listbox" aria-label="Theme options">
          {THEME_PREFERENCE_META.map((item) => {
            const selected = item.id === preference;
            const isLoading = pending === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={isLoading}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                    'hover:bg-[var(--muted)]/80',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                    selected && 'bg-[var(--muted)]/60',
                    isLoading && 'opacity-70',
                  )}
                  onClick={() => void onSelect(item.id)}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                      selected
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
                    )}
                  >
                    {ICONS[item.id]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                      {item.label}
                      {selected ? (
                        <Check className="h-3.5 w-3.5 text-[var(--primary)]" aria-hidden />
                      ) : null}
                    </span>
                    <span className="block text-xs text-[var(--muted-foreground)]">
                      {item.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
