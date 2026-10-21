import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export async function getServerCommunitiesList(): Promise<CommunityDto[] | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    return await proxyAuthGetWithToken<CommunityDto[]>('/communities', token);
  } catch {
    return null;
  }
}

export async function getServerCommunityDetail(slug: string): Promise<CommunityDto | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    return await proxyAuthGetWithToken<CommunityDto>(
      `/communities/${encodeURIComponent(slug)}`,
      token,
    );
  } catch {
    return null;
  }
}
