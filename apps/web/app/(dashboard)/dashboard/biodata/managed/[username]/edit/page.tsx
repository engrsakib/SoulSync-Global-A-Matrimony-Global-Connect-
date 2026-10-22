import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { BiodataBuilder } from '@/components/dashboard/biodata-builder';
import { BiodataLoadFallback } from '@/components/dashboard/biodata-load-fallback';
import {
  buildManagedBiodataContextValue,
  getServerEditorGrantsAsEditor,
  resolveManagedProfileByUsername,
} from '@/lib/biodata-editor-grant-server';
import { getServerManagedBiodata } from '@/lib/biodata-server';
import { loginRedirectPath } from '@/lib/auth-cookie';
import { getServerSessionUser } from '@/lib/auth-server';
import { ManagedBiodataProvider } from '@/lib/managed-biodata-context';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { scopeAllowsContent } from '@soulsync/shared-types/biodata-editor-grant';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `Edit @${username} biodata | SoulSync Global` };
}

export default async function ManagedBiodataEditPage({ params }: PageProps) {
  const user = await getServerSessionUser();
  if (!user) {
    redirect(loginRedirectPath('/dashboard/biodata/managed'));
  }

  const { username } = await params;
  const grants = await getServerEditorGrantsAsEditor();
  if (!grants) {
    return <BiodataLoadFallback />;
  }

  const managed = resolveManagedProfileByUsername(grants, username);
  if (!managed) {
    notFound();
  }

  if (!scopeAllowsContent(managed.scope)) {
    redirect(dashboardRoutes.biodataManagedUser(username));
  }

  const biodata = await getServerManagedBiodata(managed.ownerUserId);
  if (!biodata) {
    return <BiodataLoadFallback />;
  }

  const ownerDisplayName = managed.displayName ?? managed.username ?? 'Member';

  return (
    <ManagedBiodataProvider value={buildManagedBiodataContextValue(managed, ownerDisplayName)}>
      <BiodataBuilder initialBiodata={biodata} />
    </ManagedBiodataProvider>
  );
}
