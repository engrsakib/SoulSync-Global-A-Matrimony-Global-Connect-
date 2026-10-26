'use client';

import { useSyncExternalStore } from 'react';

const LG_MEDIA = '(min-width: 1024px)';
const REDUCE_MOTION_MEDIA = '(prefers-reduced-motion: reduce)';

function subscribeMedia(query: string, callback: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getMediaMatches(query: string) {
  return window.matchMedia(query).matches;
}

export function useIsLargeViewport() {
  return useSyncExternalStore(
    (cb) => subscribeMedia(LG_MEDIA, cb),
    () => getMediaMatches(LG_MEDIA),
    () => false,
  );
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (cb) => subscribeMedia(REDUCE_MOTION_MEDIA, cb),
    () => getMediaMatches(REDUCE_MOTION_MEDIA),
    () => false,
  );
}
