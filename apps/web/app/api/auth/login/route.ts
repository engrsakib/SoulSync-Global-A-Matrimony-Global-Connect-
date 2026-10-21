import { NextResponse } from 'next/server';
import { defaultAuthCookieMaxAge, proxyAuthPost } from '@/lib/api-auth-proxy';
import { AUTH_COOKIE_NAME, authCookieOptions } from '@/lib/auth-cookie';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const result = await proxyAuthPost('/auth/login', body);
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
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ message }, { status: 401 });
  }
}
