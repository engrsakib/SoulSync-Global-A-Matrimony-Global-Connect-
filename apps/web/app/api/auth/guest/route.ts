import { NextResponse } from 'next/server';
import { defaultAuthCookieMaxAge, proxyAuthPost } from '@/lib/api-auth-proxy';
import { AUTH_COOKIE_NAME, authCookieOptions } from '@/lib/auth-cookie';

export async function POST() {
  try {
    const result = await proxyAuthPost('/auth/guest', {});
    const response = NextResponse.json({
      user: result.user,
      loginCodePlain: result.loginCodePlain,
    });
    response.cookies.set(
      AUTH_COOKIE_NAME,
      result.accessToken,
      authCookieOptions(defaultAuthCookieMaxAge()),
    );
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Guest access failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
