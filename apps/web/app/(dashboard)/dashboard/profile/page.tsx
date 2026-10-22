import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ProfileOverview } from '@/components/dashboard/profile-overview';
import { loginRedirectPath } from '@/lib/auth-cookie';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerWalletSummary } from '@/lib/wallet-server';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Profile | SoulSync Global',
};

export default async function ProfilePage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect(loginRedirectPath('/dashboard/profile'));
  }

  const walletSummary = await getServerWalletSummary();

  return <ProfileOverview initialUser={user} initialWalletSummary={walletSummary} />;
}
