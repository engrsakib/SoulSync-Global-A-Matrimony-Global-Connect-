'use client';

import * as React from 'react';
import { useThemeContext } from '@/components/theme/theme-provider';

export function useThemeController() {
  const { preference, resolvedTheme, setTheme, isFixed } = useThemeContext();

  return React.useMemo(
    () => ({
      preference,
      currentTheme: preference,
      resolvedTheme,
      setTheme,
      isFixed,
    }),
    [preference, resolvedTheme, setTheme, isFixed],
  );
}
