'use client';

import * as React from 'react';

function isBioProtectionEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BIO_PROTECTION !== '0';
}

const PRINT_SCREEN_CLEAR_MS = 5_000;
const VISIBILITY_RETURN_CLEAR_MS = 2_000;

export function useCaptureDeterrent(enabled: boolean = isBioProtectionEnabled()): boolean {
  const [captureSuspected, setCaptureSuspected] = React.useState(false);
  const clearTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const visibilityReturnTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const scheduleClear = React.useCallback((delayMs: number) => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
    }
    clearTimerRef.current = setTimeout(() => {
      setCaptureSuspected(false);
      clearTimerRef.current = undefined;
    }, delayMs);
  }, []);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'PrintScreen') {
        setCaptureSuspected(true);
        scheduleClear(PRINT_SCREEN_CLEAR_MS);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (visibilityReturnTimerRef.current) {
          clearTimeout(visibilityReturnTimerRef.current);
          visibilityReturnTimerRef.current = undefined;
        }
        setCaptureSuspected(true);
        return;
      }
      if (visibilityReturnTimerRef.current) {
        clearTimeout(visibilityReturnTimerRef.current);
      }
      visibilityReturnTimerRef.current = setTimeout(() => {
        setCaptureSuspected(false);
        visibilityReturnTimerRef.current = undefined;
      }, VISIBILITY_RETURN_CLEAR_MS);
    };

    const onBeforePrint = () => {
      setCaptureSuspected(true);
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeprint', onBeforePrint);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeprint', onBeforePrint);
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
      if (visibilityReturnTimerRef.current) {
        clearTimeout(visibilityReturnTimerRef.current);
      }
    };
  }, [enabled, scheduleClear]);

  return captureSuspected;
}
