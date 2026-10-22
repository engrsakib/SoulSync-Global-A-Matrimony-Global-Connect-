import type { Gender } from '../partner-preference';

export function resolveOppositeGender(gender: Gender): Gender {
  if (gender === 'MALE') {
    return 'FEMALE';
  }
  if (gender === 'FEMALE') {
    return 'MALE';
  }
  throw new Error(`Unsupported gender: ${String(gender)}`);
}

export function normalizeMatchText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 0.5;
  }
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const INTEREST_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'are',
  'was',
  'were',
  'have',
  'has',
  'had',
  'but',
  'not',
  'you',
  'your',
  'our',
  'their',
  'they',
  'she',
  'him',
  'her',
  'who',
  'what',
  'when',
  'where',
  'how',
  'all',
  'any',
  'can',
  'will',
  'just',
  'like',
  'about',
  'into',
  'also',
  'very',
  'much',
  'more',
]);

export function tokenizeInterestText(...parts: (string | null | undefined)[]): Set<string> {
  const tokens = new Set<string>();
  const combined = parts.filter(Boolean).join(' ');
  if (!combined.trim()) {
    return tokens;
  }
  const raw = combined.toLowerCase().split(/[^a-z0-9]+/);
  for (const word of raw) {
    if (word.length < 3 || INTEREST_STOPWORDS.has(word)) {
      continue;
    }
    tokens.add(word);
  }
  return tokens;
}

export function enumListIncludes<T extends string>(
  allowed: readonly T[],
  value: T | null | undefined,
  anyValue: T = 'ANY' as T,
): boolean {
  if (!allowed.length || allowed.includes(anyValue)) {
    return true;
  }
  if (value == null) {
    return false;
  }
  return allowed.includes(value);
}

export function stringListIncludes(allowed: string[], value: string | null | undefined): boolean {
  if (!allowed.length) {
    return true;
  }
  const needle = normalizeMatchText(value);
  if (!needle) {
    return false;
  }
  return allowed.some((entry) => normalizeMatchText(entry) === needle);
}

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function averageScores(scores: number[]): number {
  const valid = scores.filter((s) => Number.isFinite(s));
  if (valid.length === 0) {
    return 50;
  }
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}
