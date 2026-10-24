import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import type { ThemePreference } from '@soulsync/shared-types/theme';
import { isThemePreference } from '@soulsync/shared-types/theme';
import {
  DEVICE_ID_COOKIE_NAME,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_PREF_COOKIE_NAME,
  isValidDeviceId,
} from './constants';

export {
  DEVICE_ID_COOKIE_NAME,
  THEME_PREF_COOKIE_NAME,
  DEVICE_ID_HEADER_NAME,
} from './constants';

function themeCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
  };
}

export function readThemePreferenceCookieValue(
  value: string | undefined,
): ThemePreference | null {
  if (!value) {
    return null;
  }
  const decoded = decodeURIComponent(value.trim());
  return isThemePreference(decoded) ? decoded : null;
}

export async function readThemePreferenceFromCookies(): Promise<ThemePreference | null> {
  const store = await cookies();
  return readThemePreferenceCookieValue(store.get(THEME_PREF_COOKIE_NAME)?.value);
}

export async function readDeviceIdFromCookies(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(DEVICE_ID_COOKIE_NAME)?.value?.trim();
  return isValidDeviceId(value) ? value : null;
}

export function attachThemeCookies(
  response: NextResponse,
  deviceId: string,
  preference: ThemePreference,
): void {
  const options = themeCookieOptions();
  response.cookies.set(DEVICE_ID_COOKIE_NAME, deviceId, options);
  response.cookies.set(THEME_PREF_COOKIE_NAME, preference, options);
}
