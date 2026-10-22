import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { BiodataLoadFallback } from '@/components/dashboard/biodata-load-fallback';
import { ManagedProfileHub } from '@/components/dashboard/managed-profile-hub';
import {
  buildManagedBiodataContextValue,
  getServerEditorGrantsAsEditor,
  resolveManagedProfileByUsername,
} from '@/lib/biodata-editor-grant-server';
import { getServerSessionUser } from '@/lib/auth-server';
import { ManagedBiodataProvider } from '@/lib/managed-biodata-context';
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `Manage @${username} | SoulSync Global` };
}

export default async function ManagedBiodataHubPage({ params }: PageProps) {
  const user = await getServerSessionUser();
  if (!user) {
    redirect('/login?next=/dashboard/biodata/managed');
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

  const ownerDisplayName = managed.displayName ?? managed.username ?? 'Member';

  return (
    <ManagedBiodataProvider value={buildManagedBiodataContextValue(managed, ownerDisplayName)}>
      <ManagedProfileHub summary={managed} username={username} />
    </ManagedBiodataProvider>
  );
}
