import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Keep in sync with `AUTH_COOKIE_NAME` in `@/lib/auth-cookie`. */
const AUTH_COOKIE_NAME = 'ss_access';

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/communities/:path*', '/dashboard/:path*', '/biodata/:path*'],
};
