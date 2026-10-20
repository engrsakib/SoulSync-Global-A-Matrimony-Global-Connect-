import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'ss_access';

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value;
}
