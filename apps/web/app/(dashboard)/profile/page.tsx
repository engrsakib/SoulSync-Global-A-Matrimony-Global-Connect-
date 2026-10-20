import type { Metadata } from 'next';
import { ProfileSettings } from '@/components/dashboard/profile-settings';
import { getServerSessionUser } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Profile | SoulSync Global',
};

export default async function ProfilePage() {
  const user = await getServerSessionUser();
  if (!user) {
    return null;
  }

  return <ProfileSettings user={user} />;
}
