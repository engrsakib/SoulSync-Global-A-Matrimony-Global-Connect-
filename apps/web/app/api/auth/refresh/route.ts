import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthProxyHttpError, proxyAuthPost } from '@/lib/api-auth-proxy';
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
    const response = NextResponse.json(
      { ok: false, code: 'SESSION_EXPIRED', message: 'Missing refresh token' },
      { status: 401 },
    );
    clearAuthCookiesOnResponse(response);
    return response;
  }

  try {
    const result = await proxyAuthPost('/auth/refresh', { refreshToken });
    const response = NextResponse.json({ ok: true });
    applyAuthCookiesToResponse(response, result);
    return response;
  } catch (error) {
    const isAuthFailure = error instanceof AuthProxyHttpError && error.status === 401;
    const message = error instanceof Error ? error.message : 'Refresh failed';
    const status = isAuthFailure ? 401 : 502;
    const body = isAuthFailure
      ? { ok: false as const, code: 'SESSION_EXPIRED' as const, message }
      : { ok: false as const, code: 'REFRESH_UNAVAILABLE' as const, message };

    const response = NextResponse.json(body, { status });
    if (isAuthFailure) {
      clearAuthCookiesOnResponse(response);
    }
    return response;
  }
}
