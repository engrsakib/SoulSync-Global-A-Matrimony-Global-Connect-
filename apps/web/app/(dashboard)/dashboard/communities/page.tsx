import type { Metadata } from 'next';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { dashboardPageTitle } from '@/lib/ui-classes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Communities | SoulSync Global',
};

export default function CommunitiesPage() {
  return (
    <div className="space-y-6">
      <h1 className={dashboardPageTitle}>Communities</h1>
      <DashboardCard title="Coming soon">
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          This is your signed-in communities space—the same dashboard layout as the rest of your
          account. Browse, search, and connect flows will be built here next.
        </p>
      </DashboardCard>
    </div>
  );
}
