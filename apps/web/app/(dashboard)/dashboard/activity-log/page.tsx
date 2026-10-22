import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ActivityLogFeed } from '@/components/dashboard/activity-log-feed';
import { loginRedirectPath } from '@/lib/auth-cookie';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerActivityLog } from '@/lib/activity-log-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Activity log | SoulSync Global',
};

export default async function ActivityLogPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect(loginRedirectPath('/dashboard/activity-log'));
  }

  const initialData = await getServerActivityLog();
  if (!initialData) {
    return <ActivityLogFeed initialData={{ items: [], nextCursor: null, viewerTimeZone: null }} />;
  }

  return <ActivityLogFeed initialData={initialData} />;
}
