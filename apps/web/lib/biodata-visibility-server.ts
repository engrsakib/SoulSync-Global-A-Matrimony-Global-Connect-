import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type {
  BiodataAccessRequestListDto,
  BiodataVisibilityPolicyDto,
} from '@soulsync/shared-types/biodata-visibility';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

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
