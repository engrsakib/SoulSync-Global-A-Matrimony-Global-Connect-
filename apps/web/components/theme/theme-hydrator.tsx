'use client';

import * as React from 'react';
import { fetchThemePreference } from '@/lib/theme/client-api';

const BACKFILL_SESSION_KEY = 'ss_theme_backfill_done';

type ThemeHydratorProps = {
  needsCookieBackfill: boolean;
};

function hasBackfillCompleted(): boolean {
  try {
    return sessionStorage.getItem(BACKFILL_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markBackfillCompleted(): void {
  try {
    sessionStorage.setItem(BACKFILL_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Backfills httpOnly theme cookie after SSR loaded preference from Redis (once per tab). */
export function ThemeHydrator({ needsCookieBackfill }: ThemeHydratorProps) {
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!needsCookieBackfill || startedRef.current || hasBackfillCompleted()) {
      return;
    }
    startedRef.current = true;

    const controller = new AbortController();

    void fetchThemePreference(controller.signal)
      .then(() => {
        markBackfillCompleted();
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        startedRef.current = false;
      });

    return () => {
      controller.abort();
    };
  }, [needsCookieBackfill]);

  return null;
}
