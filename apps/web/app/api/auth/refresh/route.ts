import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { proxyAuthPost } from '@/lib/api-auth-proxy';
import {
  applyAuthCookiesToResponse,
  clearAuthCookiesOnResponse,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth-cookie';

export async function POST(request: Request) {
  const store = await cookies();
  let refreshToken = store.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    try {
      const body = (await request.json()) as { refreshToken?: string };
      refreshToken = body.refreshToken;
    } catch {
      /* no body */
    }
  }

  if (!refreshToken) {
    return NextResponse.json({ message: 'Missing refresh token' }, { status: 401 });
  }

  try {
    const result = await proxyAuthPost('/auth/refresh', { refreshToken });
    const response = NextResponse.json({ ok: true });
    applyAuthCookiesToResponse(response, result);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refresh failed';
    const response = NextResponse.json({ message }, { status: 401 });
    clearAuthCookiesOnResponse(response);
    return response;
  }
}
