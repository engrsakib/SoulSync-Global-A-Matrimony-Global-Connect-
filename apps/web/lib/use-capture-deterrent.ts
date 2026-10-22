'use client';

import * as React from 'react';
import { CAPTURE_MIN_HOLD_MS, RECORDING_END_CLEAR_MS } from '@/lib/bio-capture-clear';
import {
  applyCaptureObscureImmediate,
  clearCaptureObscureImmediate,
} from '@/lib/bio-capture-obscure-dom';
import { isScreenshotShortcutKey } from '@/lib/bio-capture-signals';

function isBioProtectionEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BIO_PROTECTION !== '0';
}

export function useCaptureDeterrent(
  enabled: boolean = isBioProtectionEnabled(),
  obscureTargetRef?: React.RefObject<HTMLElement | null>,
): boolean {
  const [captureSuspected, setCaptureSuspected] = React.useState(false);
  const clearTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const getObscureNode = () => obscureTargetRef?.current ?? null;

    const scheduleClear = (delayMs: number) => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
      clearTimerRef.current = setTimeout(() => {
        setCaptureSuspected(false);
        clearCaptureObscureImmediate(getObscureNode());
        clearTimerRef.current = undefined;
      }, delayMs);
    };

    const markCapture = (clearAfterMs?: number) => {
      applyCaptureObscureImmediate(getObscureNode());
      setCaptureSuspected(true);
      if (clearAfterMs !== undefined) {
        scheduleClear(clearAfterMs);
      } else if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = undefined;
      }
    };

    const onShortcutKey = (event: KeyboardEvent) => {
      if (!isScreenshotShortcutKey(event)) {
        return;
      }
      markCapture(CAPTURE_MIN_HOLD_MS);
    };

    const onBeforePrint = () => {
      markCapture();
    };

    const mediaDevices = navigator.mediaDevices;
    let restoreGetDisplayMedia: (() => void) | undefined;

    if (mediaDevices?.getDisplayMedia) {
      const original = mediaDevices.getDisplayMedia.bind(mediaDevices);
      mediaDevices.getDisplayMedia = function patchedGetDisplayMedia(
        ...args: Parameters<typeof mediaDevices.getDisplayMedia>
      ) {
        markCapture();
        return original(...args).then((stream) => {
          const onTrackEnded = () => {
            scheduleClear(RECORDING_END_CLEAR_MS);
          };
          for (const track of stream.getTracks()) {
            track.addEventListener('ended', onTrackEnded, { once: true });
          }
          return stream;
        });
      };
      restoreGetDisplayMedia = () => {
        mediaDevices.getDisplayMedia = original;
      };
    }

    const keyOptions: AddEventListenerOptions = { capture: true };
    window.addEventListener('keydown', onShortcutKey, keyOptions);
    window.addEventListener('keyup', onShortcutKey, keyOptions);
    document.addEventListener('keydown', onShortcutKey, keyOptions);
    document.addEventListener('keyup', onShortcutKey, keyOptions);
    window.addEventListener('beforeprint', onBeforePrint);

    return () => {
      window.removeEventListener('keydown', onShortcutKey, keyOptions);
      window.removeEventListener('keyup', onShortcutKey, keyOptions);
      document.removeEventListener('keydown', onShortcutKey, keyOptions);
      document.removeEventListener('keyup', onShortcutKey, keyOptions);
      window.removeEventListener('beforeprint', onBeforePrint);
      restoreGetDisplayMedia?.();
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, [enabled, obscureTargetRef]);

  return captureSuspected;
}
