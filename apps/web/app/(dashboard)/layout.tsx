import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getServerSessionUser } from '@/lib/auth-server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) {
    redirect('/login?next=/profile');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
