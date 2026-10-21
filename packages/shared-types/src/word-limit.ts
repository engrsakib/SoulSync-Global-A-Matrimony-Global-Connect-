export const BIODATA_COMMUNITY_MAX_WORDS = 300;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/u).filter(Boolean).length;
}

/** Keeps at most `maxWords` words; preserves text when already within limit. */
export function limitToMaxWords(text: string, maxWords: number): string {
  const words = text.match(/\S+/gu) ?? [];
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(' ');
}
