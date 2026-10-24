import type { ResolvedTheme, ThemePreference } from '@soulsync/shared-types/theme';

export type ThemeApiResponse = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
};

export async function fetchThemePreference(signal?: AbortSignal): Promise<ThemeApiResponse> {
  const response = await fetch('/api/user/theme', {
    method: 'GET',
    credentials: 'same-origin',
    signal,
  });
  if (!response.ok) {
    throw new Error('Failed to load theme preference');
  }
  return (await response.json()) as ThemeApiResponse;
}

export async function saveThemePreference(
  preference: ThemePreference,
  signal?: AbortSignal,
): Promise<ThemeApiResponse> {
  const response = await fetch('/api/user/theme', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: preference }),
    signal,
  });
  if (!response.ok) {
    throw new Error('Failed to save theme preference');
  }
  return (await response.json()) as ThemeApiResponse;
}
