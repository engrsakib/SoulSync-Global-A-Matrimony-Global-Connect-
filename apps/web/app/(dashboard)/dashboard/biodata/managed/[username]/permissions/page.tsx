import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BiodataPermissionRequests } from '@/components/dashboard/biodata-permission-requests';
import {
  buildManagedBiodataContextValue,
  getServerEditorGrantsAsEditor,
  resolveManagedProfileByUsername,
} from '@/lib/biodata-editor-grant-server';
import { getServerManagedBiodataAccessRequests } from '@/lib/biodata-visibility-server';
import { getServerSessionUser } from '@/lib/auth-server';
import { ManagedBiodataProvider } from '@/lib/managed-biodata-context';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { scopeAllowsSettings } from '@soulsync/shared-types/biodata-editor-grant';
import { btnPrimaryOutline } from '@/lib/ui-classes';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `View access — @${username} | SoulSync Global` };
}

export default async function ManagedBiodataPermissionsPage({ params }: PageProps) {
  const user = await getServerSessionUser();
  if (!user) {
    redirect('/login?next=/dashboard/biodata/managed');
  }

  const { username } = await params;
  const grants = await getServerEditorGrantsAsEditor();
  if (!grants) {
    notFound();
  }

  const managed = resolveManagedProfileByUsername(grants, username);
  if (!managed) {
    notFound();
  }

  if (!scopeAllowsSettings(managed.scope)) {
    redirect(dashboardRoutes.biodataManagedUser(username));
  }

  const accessRequests = await getServerManagedBiodataAccessRequests(managed.ownerUserId);
  if (!accessRequests) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Could not load view access requests.</p>
        <Link href={dashboardRoutes.biodataManagedUser(username)} className={btnPrimaryOutline}>
          Back to overview
        </Link>
      </div>
    );
  }

  const ownerDisplayName = managed.displayName ?? managed.username ?? 'Member';

  return (
    <ManagedBiodataProvider value={buildManagedBiodataContextValue(managed, ownerDisplayName)}>
      <BiodataPermissionRequests
        initialAccessRequests={accessRequests}
        managedOwnerUserId={managed.ownerUserId}
        hideEditSection
        pageTitle={`View access for ${ownerDisplayName}`}
        pageDescription="Review members who asked to view protected sections of this biodata."
        backHref={dashboardRoutes.biodataManagedUser(username)}
        backLabel="Back to overview"
      />
    </ManagedBiodataProvider>
  );
}
