/** Blocking script: resolves `system` preference before first paint. */
export function ThemeScript() {
  const script = `
(function () {
  var root = document.documentElement;
  var pref = root.getAttribute('data-theme-preference');
  if (pref !== 'system') return;
  var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
