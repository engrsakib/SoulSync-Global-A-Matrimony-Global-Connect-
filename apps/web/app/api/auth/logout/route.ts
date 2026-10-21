import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, authCookieOptions } from '@/lib/auth-cookie';

export function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, '', { ...authCookieOptions(0), maxAge: 0 });
  return response;
}
