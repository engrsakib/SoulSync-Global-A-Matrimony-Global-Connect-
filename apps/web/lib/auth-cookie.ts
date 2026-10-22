import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { cache } from 'react';
import { proxyAuthPost, type NestAuthResponse } from '@/lib/api-auth-proxy';
import { runKeyedSingleFlight } from '@/lib/auth-refresh-single-flight';

export const AUTH_COOKIE_NAME = 'ss_access';
export const REFRESH_COOKIE_NAME = 'ss_refresh';

/** Seconds of clock skew before treating access JWT as expired. */
const ACCESS_EXPIRY_SKEW_SECONDS = 15;

export function parseTtlSeconds(ttl: string): number {
  const match = /^(\d+)([dhms])$/.exec(ttl.trim());
  if (!match) {
    return 60 * 60 * 24 * 7;
  }
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'd':
      return value * 86400;
    case 'h':
      return value * 3600;
    case 'm':
      return value * 60;
    default:
      return value;
  }
}

export function accessCookieMaxAge(): number {
  return parseTtlSeconds(process.env.JWT_ACCESS_TTL ?? '2m');
}

export function refreshCookieMaxAge(): number {
  return parseTtlSeconds(process.env.JWT_REFRESH_TTL ?? '7d');
}

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function loginRedirectPath(next: string): string {
  const params = new URLSearchParams({
    reason: 'session_expired',
    next,
  });
  return `/login?${params.toString()}`;
}

function decodeJwtExpSeconds(token: string): number | null {
  const parts = token.split('.');
  const encoded = parts[1];
  if (!encoded) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      exp?: number;
    };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isAccessTokenUsable(token: string): boolean {
  const exp = decodeJwtExpSeconds(token);
  if (exp === null) {
    return true;
  }
  const now = Math.floor(Date.now() / 1000);
  return exp > now + ACCESS_EXPIRY_SKEW_SECONDS;
}

export async function persistAuthTokensToCookieStore(
  tokens: Pick<NestAuthResponse, 'accessToken' | 'refreshToken'>,
): Promise<void> {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, tokens.accessToken, authCookieOptions(accessCookieMaxAge()));
  store.set(REFRESH_COOKIE_NAME, tokens.refreshToken, authCookieOptions(refreshCookieMaxAge()));
}

export function applyAuthCookiesToResponse(
  response: NextResponse,
  tokens: Pick<NestAuthResponse, 'accessToken' | 'refreshToken'>,
): void {
  response.cookies.set(
    AUTH_COOKIE_NAME,
    tokens.accessToken,
    authCookieOptions(accessCookieMaxAge()),
  );
  response.cookies.set(
    REFRESH_COOKIE_NAME,
    tokens.refreshToken,
    authCookieOptions(refreshCookieMaxAge()),
  );
}

export function clearAuthCookiesOnResponse(response: NextResponse): void {
  const cleared = authCookieOptions(0);
  response.cookies.set(AUTH_COOKIE_NAME, '', { ...cleared, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE_NAME, '', { ...cleared, maxAge: 0 });
}

async function refreshAccessFromRefreshToken(refreshToken: string): Promise<string | undefined> {
  try {
    const result = await proxyAuthPost('/auth/refresh', { refreshToken });
    await persistAuthTokensToCookieStore(result);
    return result.accessToken;
  } catch {
    return undefined;
  }
}

function refreshAccessSingleFlight(refreshToken: string): Promise<string | undefined> {
  return runKeyedSingleFlight(refreshToken, () => refreshAccessFromRefreshToken(refreshToken));
}

async function resolveValidAccessTokenFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  const access = store.get(AUTH_COOKIE_NAME)?.value;
  if (access && isAccessTokenUsable(access)) {
    return access;
  }

  const refresh = store.get(REFRESH_COOKIE_NAME)?.value;
  if (!refresh) {
    return undefined;
  }

  return refreshAccessSingleFlight(refresh);
}

/** Returns a usable access token, refreshing via httpOnly refresh cookie when needed. */
export const getValidAccessTokenFromCookies = cache(resolveValidAccessTokenFromCookies);

export const getAccessTokenFromCookies = getValidAccessTokenFromCookies;
