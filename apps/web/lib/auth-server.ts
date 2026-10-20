import { proxyAuthGetMe } from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';
import type { PublicUser } from '@/lib/auth-api';

export async function getServerSessionUser(): Promise<PublicUser | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    const user = (await proxyAuthGetMe(token)) as PublicUser;
    return user;
  } catch {
    return null;
  }
}
