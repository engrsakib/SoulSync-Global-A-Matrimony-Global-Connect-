import { headers } from 'next/headers';
import {
  DEFAULT_THEME_PREFERENCE,
  resolveThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '@soulsync/shared-types/theme';
import { DEVICE_ID_HEADER_NAME, isValidDeviceId } from './constants';
import {
  readDeviceIdFromCookies,
  readThemePreferenceFromCookies,
} from './cookies';
import { readThemePreferenceFromRedis } from './redis';

export type ServerThemeState = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  deviceId: string | null;
  themeFromCookie: boolean;
  /** True when SSR read Redis but httpOnly cookie missing; client backfill runs once per tab. */
  needsCookieBackfill: boolean;
};

function readPrefersDarkFromHeaders(headerStore: Headers): boolean {
  const hint = headerStore.get('sec-ch-prefers-color-scheme')?.toLowerCase();
  if (hint === 'dark') {
    return true;
  }
  if (hint === 'light') {
    return false;
  }
  return false;
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

export async function getServerThemeState(): Promise<ServerThemeState> {
  const headerStore = await headers();
  const prefersDark = readPrefersDarkFromHeaders(headerStore);
  const deviceId = await resolveDeviceId();

  const fromCookie = await readThemePreferenceFromCookies();
  if (fromCookie) {
    return {
      preference: fromCookie,
      resolvedTheme: resolveThemePreference(fromCookie, prefersDark),
      deviceId,
      themeFromCookie: true,
      needsCookieBackfill: false,
    };
  }

  let preference: ThemePreference = DEFAULT_THEME_PREFERENCE;
  let needsCookieBackfill = false;

  if (deviceId) {
    const fromRedis = await readThemePreferenceFromRedis(deviceId);
    if (fromRedis) {
      preference = fromRedis;
      needsCookieBackfill = true;
    }
  }

  return {
    preference,
    resolvedTheme: resolveThemePreference(preference, prefersDark),
    deviceId,
    themeFromCookie: false,
    needsCookieBackfill,
  };
}
