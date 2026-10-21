import type { Metadata } from 'next';
import { ProfileOverview } from '@/components/dashboard/profile-overview';
import { getServerSessionUser } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'My Profile | SoulSync Global',
};

export default async function ProfilePage() {
  const user = await getServerSessionUser();
  if (!user) {
    return null;
  }

  return <ProfileOverview user={user} />;
}
