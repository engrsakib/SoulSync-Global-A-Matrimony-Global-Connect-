import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Keep in sync with `@/lib/auth-cookie`. */
const AUTH_COOKIE_NAME = 'ss_access';
const REFRESH_COOKIE_NAME = 'ss_refresh';

export function middleware(request: NextRequest) {
  const access = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (access || refresh) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/communities/:path*', '/dashboard/:path*', '/biodata/:path*'],
};
