/** User-selected theme preference (stored in cookie + Redis). */
export const THEME_PREFERENCES = [
  'light',
  'dark',
  'system',
  'cool-slate',
  'sepia',
  'amoled',
  'sage-nature',
] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Resolved palette applied to `html[data-theme]`. */
export const RESOLVED_THEMES = [
  'light',
  'dark',
  'cool-slate',
  'sepia',
  'amoled',
  'sage-nature',
] as const;

export type ResolvedTheme = (typeof RESOLVED_THEMES)[number];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'light';

export const THEME_REDIS_TTL_SECONDS = 31_104_000;

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

export function resolveThemePreference(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return preference;
}

export type ThemePreferenceMeta = {
  id: ThemePreference;
  label: string;
  description: string;
};

export const THEME_PREFERENCE_META: ThemePreferenceMeta[] = [
  { id: 'light', label: 'Light', description: 'Default SoulSync palette' },
  { id: 'dark', label: 'Dark', description: 'Comfortable low-light contrast' },
  { id: 'system', label: 'System', description: 'Follow your device appearance' },
  { id: 'cool-slate', label: 'Cool Slate', description: 'Soft slate and cyan tones' },
  { id: 'sepia', label: 'Sepia', description: 'Warm paper reading mode' },
  { id: 'amoled', label: 'AMOLED', description: 'Pure black for OLED displays' },
  { id: 'sage-nature', label: 'Sage Nature', description: 'Calm forest greens' },
];
