import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type {
  BiodataAccessRequestListDto,
  BiodataVisibilityPolicyDto,
} from '@soulsync/shared-types/biodata-visibility';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export async function getServerManagedBiodataVisibility(
  ownerUserId: string,
): Promise<{ policy: BiodataVisibilityPolicyDto } | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    const policy = await proxyAuthGetWithToken<BiodataVisibilityPolicyDto>(
      `/biodata/managed/${encodeURIComponent(ownerUserId)}/visibility`,
      token,
    );
    return { policy };
  } catch {
    return null;
  }
}

export async function getServerManagedBiodataAccessRequests(
  ownerUserId: string,
): Promise<BiodataAccessRequestListDto | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    return await proxyAuthGetWithToken<BiodataAccessRequestListDto>(
      `/biodata/managed/${encodeURIComponent(ownerUserId)}/access-requests`,
      token,
    );
  } catch {
    return null;
  }
}

export async function getServerBiodataVisibility(): Promise<{
  policy: BiodataVisibilityPolicyDto;
  accessRequests: BiodataAccessRequestListDto;
} | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    const [policy, accessRequests] = await Promise.all([
      proxyAuthGetWithToken<BiodataVisibilityPolicyDto>('/biodata/visibility', token),
      proxyAuthGetWithToken<BiodataAccessRequestListDto>('/biodata/access-requests', token),
    ]);
    return { policy, accessRequests };
  } catch {
    return null;
  }
}
