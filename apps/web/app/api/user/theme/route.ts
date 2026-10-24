import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  DEFAULT_THEME_PREFERENCE,
  isThemePreference,
  resolveThemePreference,
  type ThemePreference,
} from '@soulsync/shared-types/theme';
import {
  attachThemeCookies,
  readDeviceIdFromCookies,
  readThemePreferenceFromCookies,
} from '@/lib/theme/cookies';
import { DEVICE_ID_HEADER_NAME, isValidDeviceId } from '@/lib/theme/constants';
import {
  readThemePreferenceFromRedis,
  writeThemePreferenceToRedis,
} from '@/lib/theme/redis';

export const dynamic = 'force-dynamic';

function readPrefersDarkFromHeaders(headerStore: Headers): boolean {
  const hint = headerStore.get('sec-ch-prefers-color-scheme')?.toLowerCase();
  return hint === 'dark';
}

async function resolveDeviceId(): Promise<string | null> {
  const fromCookie = await readDeviceIdFromCookies();
  if (fromCookie) {
    return fromCookie;
  }
  const headerStore = await headers();
  const fromHeader = headerStore.get(DEVICE_ID_HEADER_NAME)?.trim();
  return isValidDeviceId(fromHeader) ? fromHeader : null;
}

function jsonWithThemeCookies(
  deviceId: string,
  preference: ThemePreference,
  body: Record<string, unknown>,
): NextResponse {
  const response = NextResponse.json(body);
  attachThemeCookies(response, deviceId, preference);
  return response;
}

export async function GET(): Promise<NextResponse> {
  const deviceId = await resolveDeviceId();
  const headerStore = await headers();
  const prefersDark = readPrefersDarkFromHeaders(headerStore);

  if (!deviceId) {
    const preference = DEFAULT_THEME_PREFERENCE;
    return NextResponse.json({
      preference,
      resolvedTheme: resolveThemePreference(preference, prefersDark),
    });
  }

  const fromCookie = await readThemePreferenceFromCookies();
  const preference =
    fromCookie ?? (await readThemePreferenceFromRedis(deviceId)) ?? DEFAULT_THEME_PREFERENCE;

  return jsonWithThemeCookies(deviceId, preference, {
    preference,
    resolvedTheme: resolveThemePreference(preference, prefersDark),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const deviceId = await resolveDeviceId();
  if (!deviceId) {
    return NextResponse.json({ message: 'Device id is required' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  let theme: ThemePreference | null = null;
  if (typeof body === 'object' && body !== null && 'theme' in body) {
    const candidate = body.theme;
    if (isThemePreference(candidate)) {
      theme = candidate;
    }
  }

  if (!theme) {
    return NextResponse.json({ message: 'Invalid theme preference' }, { status: 400 });
  }

  await writeThemePreferenceToRedis(deviceId, theme);

  const headerStore = await headers();
  const prefersDark = readPrefersDarkFromHeaders(headerStore);

  return jsonWithThemeCookies(deviceId, theme, {
    preference: theme,
    resolvedTheme: resolveThemePreference(theme, prefersDark),
  });
}
