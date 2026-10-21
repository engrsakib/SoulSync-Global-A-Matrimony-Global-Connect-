import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ProfileTransactions } from '@/components/dashboard/profile-transactions';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { getServerSessionUser } from '@/lib/auth-server';
import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { CreditTransactionListDto } from '@soulsync/shared-types/credits';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';
import { btnPrimaryOutline } from '@/lib/ui-classes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Points history | SoulSync Global',
};

async function getServerWalletTransactions(): Promise<CreditTransactionListDto | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }
  try {
    return await proxyAuthGetWithToken<CreditTransactionListDto>(
      '/wallet/transactions',
      token,
    );
  } catch {
    return null;
  }
}

export default async function ProfileTransactionsPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(dashboardRoutes.profileTransactions)}`);
  }

  const initialData = await getServerWalletTransactions();

  if (!initialData) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Could not load points history. Make sure the API is running and try again.
        </p>
        <Link href={dashboardRoutes.profile} className={btnPrimaryOutline}>
          Back to profile
        </Link>
      </div>
    );
  }

  return <ProfileTransactions initialData={initialData} />;
}
