import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  DEVICE_ID_COOKIE_NAME,
  DEVICE_ID_HEADER_NAME,
  THEME_COOKIE_MAX_AGE_SECONDS,
  isValidDeviceId,
} from '@/lib/theme/constants';

/** Keep in sync with `@/lib/auth-cookie`. */
const AUTH_COOKIE_NAME = 'ss_access';
const REFRESH_COOKIE_NAME = 'ss_refresh';

const PROTECTED_PREFIXES = ['/communities', '/dashboard', '/biodata'] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function deviceCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const access = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  const existingDevice = request.cookies.get(DEVICE_ID_COOKIE_NAME)?.value;
  const deviceId = isValidDeviceId(existingDevice) ? existingDevice : crypto.randomUUID();

  let response: NextResponse;

  if (isProtectedPath(pathname) && !access && !refresh) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    response = NextResponse.redirect(loginUrl);
  } else {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(DEVICE_ID_HEADER_NAME, deviceId);
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!isValidDeviceId(existingDevice)) {
    response.cookies.set(DEVICE_ID_COOKIE_NAME, deviceId, deviceCookieOptions());
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
