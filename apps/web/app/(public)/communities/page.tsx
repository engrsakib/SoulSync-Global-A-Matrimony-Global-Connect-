import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerCommunitiesList } from '@/lib/communities-server';
import { memberRoutes } from '@/lib/member-routes';
import { CommunitiesPageShell } from '@/components/communities/communities-page-shell';
import { CommunitiesDirectory } from '@/components/communities/communities-directory';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Communities | SoulSync Global',
  description: 'Browse and join member communities in your tenant.',
};

export default async function CommunitiesPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(memberRoutes.communities)}`);
  }

  const list = await getServerCommunitiesList();
  const loadFailed = list === null;

  return (
    <CommunitiesPageShell
      title="Communities"
      subtitle="Member communities in your tenant—discover, join, and share updates. (Distinct from platform tenants on the homepage.)"
    >
      <CommunitiesDirectory initialCommunities={list} loadFailed={loadFailed} />
    </CommunitiesPageShell>
  );
}
