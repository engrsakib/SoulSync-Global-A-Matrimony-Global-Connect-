import { NextResponse } from 'next/server';
import {
  clearAuthCookiesOnResponse,
  getAccessTokenFromCookies,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth-cookie';
import { proxyAuthPostJson } from '@/lib/api-auth-proxy';
import { cookies } from 'next/headers';

export async function POST() {
  const token = await getAccessTokenFromCookies();
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE_NAME)?.value;

  if (token) {
    try {
      await proxyAuthPostJson('/auth/logout', refreshToken ? { refreshToken } : {}, token);
    } catch {
      /* still clear cookies locally */
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookiesOnResponse(response);
  return response;
}
