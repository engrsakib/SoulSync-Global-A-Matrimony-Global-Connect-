import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerBiodataVisibility } from '@/lib/biodata-visibility-server';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, visibility] = await Promise.all([
    getServerSessionUser(),
    getServerBiodataVisibility(),
  ]);
  if (!user) {
    redirect('/login?next=/dashboard/profile');
  }

  const initialPendingAccessRequestCount = visibility?.accessRequests.pending.length ?? 0;

  return (
    <DashboardShell user={user} initialPendingAccessRequestCount={initialPendingAccessRequestCount}>
      {children}
    </DashboardShell>
  );
}
