import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BiodataPermissionRequests } from '@/components/dashboard/biodata-permission-requests';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { getServerBiodataVisibility } from '@/lib/biodata-visibility-server';
import { getServerEditorGrantsAsOwner } from '@/lib/biodata-editor-grant-server';
import { loginRedirectPath } from '@/lib/auth-cookie';
import { getServerSessionUser } from '@/lib/auth-server';
import { btnPrimaryOutline } from '@/lib/ui-classes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Permission requests | SoulSync Global',
};

export default async function BiodataPermissionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getServerSessionUser();
  if (!user) {
    redirect(loginRedirectPath('/dashboard/biodata/permission-requests'));
  }

  const { tab } = await searchParams;
  const initialSection = tab === 'edit' ? 'edit' : 'view';

  const [visibilityData, editorGrantsAsOwner] = await Promise.all([
    getServerBiodataVisibility(),
    getServerEditorGrantsAsOwner(),
  ]);

  if (!visibilityData) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Could not load permission requests. Make sure the API is running and try again.
        </p>
        <Link href={dashboardRoutes.biodataSettings} className={btnPrimaryOutline}>
          Back to biodata settings
        </Link>
      </div>
    );
  }

  return (
    <BiodataPermissionRequests
      initialAccessRequests={visibilityData.accessRequests}
      initialSection={initialSection}
      initialPendingEditIncomingCount={editorGrantsAsOwner?.pendingIncoming.length ?? 0}
    />
  );
}
