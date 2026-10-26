'use client';

import { useServerInsertedHTML } from 'next/navigation';

/** Blocking script: resolves `system` preference before first paint. */
const THEME_SYSTEM_RESOLVE_SCRIPT = `
(function () {
  var root = document.documentElement;
  var pref = root.getAttribute('data-theme-preference');
  if (pref !== 'system') return;
  var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
`.trim();

/** SSR-only script injection — avoids React 19 client render warning for \`<script>\` in the tree. */
export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script
      id="ss-theme-system-resolve"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SYSTEM_RESOLVE_SCRIPT }}
    />
  ));

  return null;
}
