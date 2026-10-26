export function isGifMessageText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  if (/^https?:\/\/\S+\.gif(\?\S*)?$/i.test(trimmed)) {
    return true;
  }
  if (/^https?:\/\/(media\.giphy\.com|i\.giphy\.com|c\.tenor\.com)\/\S+/i.test(trimmed)) {
    return true;
  }
  return false;
}

export function extractGifUrl(text: string): string | null {
  return isGifMessageText(text) ? text.trim() : null;
}
