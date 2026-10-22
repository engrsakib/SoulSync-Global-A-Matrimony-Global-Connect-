import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BiodataSettings } from '@/components/dashboard/biodata-settings';
import {
  buildManagedBiodataContextValue,
  getServerEditorGrantsAsEditor,
  resolveManagedProfileByUsername,
} from '@/lib/biodata-editor-grant-server';
import { scopeAllowsSettings } from '@soulsync/shared-types/biodata-editor-grant';
import { getServerManagedBiodata } from '@/lib/biodata-server';
import { getServerManagedBiodataVisibility } from '@/lib/biodata-visibility-server';
import { getServerSessionUser } from '@/lib/auth-server';
import { ManagedBiodataProvider } from '@/lib/managed-biodata-context';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { btnPrimaryOutline } from '@/lib/ui-classes';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `Manage @${username} settings | SoulSync Global` };
}

export default async function ManagedBiodataSettingsPage({ params }: PageProps) {
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

  const [biodata, visibilityData] = await Promise.all([
    getServerManagedBiodata(managed.ownerUserId),
    getServerManagedBiodataVisibility(managed.ownerUserId),
  ]);

  if (!biodata || !visibilityData) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Could not load managed biodata settings.</p>
        <Link href={dashboardRoutes.biodataManaged} className={btnPrimaryOutline}>
          Back to biodata I manage
        </Link>
      </div>
    );
  }

  const ownerDisplayName = managed.displayName ?? managed.username ?? 'Member';

  return (
    <ManagedBiodataProvider value={buildManagedBiodataContextValue(managed, ownerDisplayName)}>
      <BiodataSettings initialProfile={biodata.profile} initialPolicy={visibilityData.policy} />
    </ManagedBiodataProvider>
  );
}
