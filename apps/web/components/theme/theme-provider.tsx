'use client';

import * as React from 'react';
import {
  resolveThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '@soulsync/shared-types/theme';
import { saveThemePreference } from '@/lib/theme/client-api';

export type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => Promise<void>;
  isFixed: true;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  initialPreference: ThemePreference;
  initialResolvedTheme: ResolvedTheme;
  children: React.ReactNode;
};

function applyDomTheme(preference: ThemePreference, resolvedTheme: ResolvedTheme): void {
  const root = document.documentElement;
  if (root.getAttribute('data-theme-preference') !== preference) {
    root.setAttribute('data-theme-preference', preference);
  }
  if (root.getAttribute('data-theme') !== resolvedTheme) {
    root.setAttribute('data-theme', resolvedTheme);
  }
}

function readSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({
  initialPreference,
  initialResolvedTheme,
  children,
}: ThemeProviderProps) {
  const [preference, setPreference] = React.useState(initialPreference);
  const [resolvedTheme, setResolvedTheme] = React.useState(initialResolvedTheme);

  const mountedRef = React.useRef(true);
  const saveAbortRef = React.useRef<AbortController | null>(null);
  const transitionsEnabledRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      saveAbortRef.current?.abort();
      saveAbortRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (transitionsEnabledRef.current) {
      return;
    }
    transitionsEnabledRef.current = true;
    const frame = requestAnimationFrame(() => {
      document.documentElement.classList.add('theme-transitions');
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  React.useEffect(() => {
    applyDomTheme(preference, resolvedTheme);
  }, [preference, resolvedTheme]);

  React.useEffect(() => {
    if (preference !== 'system') {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      const resolved = resolveThemePreference('system', media.matches);
      setResolvedTheme((prev) => (prev === resolved ? prev : resolved));
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [preference]);

  const setTheme = React.useCallback(async (next: ThemePreference) => {
    saveAbortRef.current?.abort();
    const controller = new AbortController();
    saveAbortRef.current = controller;

    const optimisticResolved =
      next === 'system'
        ? resolveThemePreference('system', readSystemPrefersDark())
        : resolveThemePreference(next, false);

    setPreference((prev) => (prev === next ? prev : next));
    setResolvedTheme((prev) => (prev === optimisticResolved ? prev : optimisticResolved));
    applyDomTheme(next, optimisticResolved);

    try {
      const saved = await saveThemePreference(next, controller.signal);
      if (!mountedRef.current || controller.signal.aborted) {
        return;
      }
      setPreference((prev) => (prev === saved.preference ? prev : saved.preference));
      setResolvedTheme((prev) => (prev === saved.resolvedTheme ? prev : saved.resolvedTheme));
      applyDomTheme(saved.preference, saved.resolvedTheme);
    } catch {
      if (controller.signal.aborted) {
        return;
      }
      /* keep optimistic state; user can retry */
    } finally {
      if (saveAbortRef.current === controller) {
        saveAbortRef.current = null;
      }
    }
  }, []);

  const value = React.useMemo(
    (): ThemeContextValue => ({
      preference,
      resolvedTheme,
      setTheme,
      isFixed: true,
    }),
    [preference, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
}
