import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { UserActivityLogListDto } from '@soulsync/shared-types/activity-log';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export async function getServerActivityLog(): Promise<UserActivityLogListDto | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    return await proxyAuthGetWithToken<UserActivityLogListDto>('/activity-log', token);
  } catch {
    return null;
  }
}
