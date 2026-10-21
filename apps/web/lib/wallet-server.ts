import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { CreditWalletSummaryDto } from '@soulsync/shared-types/credits';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export async function getServerWalletSummary(): Promise<CreditWalletSummaryDto | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    return await proxyAuthGetWithToken<CreditWalletSummaryDto>('/wallet', token);
  } catch {
    return null;
  }
}
