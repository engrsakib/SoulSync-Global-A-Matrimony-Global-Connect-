import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BiodataSettings } from '@/components/dashboard/biodata-settings';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { getServerBiodataVisibility } from '@/lib/biodata-visibility-server';
import { getServerSessionUser } from '@/lib/auth-server';
import { btnPrimaryOutline } from '@/lib/ui-classes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Biodata settings | SoulSync Global',
};

export default async function BiodataSettingsPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect('/login?next=/dashboard/biodata/settings');
  }

  const data = await getServerBiodataVisibility();
  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Could not load biodata visibility settings. Make sure the API is running and try again.
        </p>
        <Link href={dashboardRoutes.biodata} className={btnPrimaryOutline}>
          Back to biodata
        </Link>
      </div>
    );
  }

  return (
    <BiodataSettings
      initialPolicy={data.policy}
      initialAccessRequests={data.accessRequests}
    />
  );
}
