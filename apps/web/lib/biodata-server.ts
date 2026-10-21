import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export async function getServerBiodata(): Promise<BiodataMeDto | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    return await proxyAuthGetWithToken<BiodataMeDto>('/biodata/me', token);
  } catch {
    return null;
  }
}
