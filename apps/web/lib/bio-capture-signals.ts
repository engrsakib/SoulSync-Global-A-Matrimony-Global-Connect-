const MAC_SCREENSHOT_DIGITS = new Set(['3', '4', '5']);
const MAC_SCREENSHOT_CODES = new Set(['Digit3', 'Digit4', 'Digit5']);

function isPrintScreenKey(event: KeyboardEvent): boolean {
  if (event.key === 'PrintScreen' || event.code === 'PrintScreen') {
    return true;
  }
  if (event.keyCode === 44 || event.which === 44) {
    return true;
  }
  if (event.code === 'F13') {
    return true;
  }
  return false;
}

function isMacScreenshotChord(event: KeyboardEvent): boolean {
  if (!event.metaKey || !event.shiftKey) {
    return false;
  }
  const digitMatch = MAC_SCREENSHOT_DIGITS.has(event.key) || MAC_SCREENSHOT_CODES.has(event.code);
  if (!digitMatch) {
    return false;
  }
  return true;
}

/** Win+Shift+S and similar when the browser receives the chord (OS may intercept first). */
function isSnippingToolChord(event: KeyboardEvent): boolean {
  if (event.key.toLowerCase() !== 's' || !event.shiftKey || event.ctrlKey) {
    return false;
  }
  const osHeld = event.metaKey || event.getModifierState('OS');
  return osHeld;
}

/** Desktop screenshot shortcuts when the page has focus (best-effort; OS may intercept first). */
export function isScreenshotShortcutKey(event: KeyboardEvent): boolean {
  if (isPrintScreenKey(event)) {
    return true;
  }
  if (isMacScreenshotChord(event)) {
    return true;
  }
  if (isSnippingToolChord(event)) {
    return true;
  }
  return false;
}
