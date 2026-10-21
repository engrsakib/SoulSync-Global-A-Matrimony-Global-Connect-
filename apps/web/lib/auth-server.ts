import { redirect } from 'next/navigation';
import { proxyAuthGetMe } from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';
import type { PublicUser } from '@/lib/auth-api';
import { dashboardRoutes } from '@/lib/dashboard-routes';

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

/** Send logged-in users away from guest-only auth pages (login, register). */
export async function redirectIfLoggedIn(
  destination: string = dashboardRoutes.profile,
): Promise<void> {
  const user = await getServerSessionUser();
  if (user) {
    redirect(destination);
  }
}
