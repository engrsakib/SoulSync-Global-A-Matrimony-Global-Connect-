import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ProfileOverview } from '@/components/dashboard/profile-overview';
import { getServerSessionUser } from '@/lib/auth-server';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Profile | SoulSync Global',
};

export default async function ProfilePage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect('/login?next=/dashboard/profile');
  }

  return <ProfileOverview initialUser={user} />;
}
