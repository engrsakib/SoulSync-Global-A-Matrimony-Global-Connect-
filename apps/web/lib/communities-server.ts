import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { CommunityDto, CommunityFeedDto } from '@soulsync/shared-types/communities';
import { normalizeCommunityFeed } from '@/lib/communities-feed-state';
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

export async function getServerCommunityFeed(slug: string): Promise<CommunityFeedDto | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    const feed = await proxyAuthGetWithToken<CommunityFeedDto>(
      `/communities/${encodeURIComponent(slug)}/posts`,
      token,
    );
    return normalizeCommunityFeed(feed);
  } catch {
    return null;
  }
}
