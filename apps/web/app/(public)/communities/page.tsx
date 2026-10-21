import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerCommunitiesList } from '@/lib/communities-server';
import { memberRoutes } from '@/lib/member-routes';
import { CommunitiesPageShell } from '@/components/communities/communities-page-shell';
import { CommunitiesDirectory } from '@/components/communities/communities-directory';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Groups | SoulSync Global',
  description: 'Browse and join member groups in your community.',
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
      title="Groups"
      subtitle="Member groups in your community—discover, join, and share updates. (Distinct from platform tenants on the homepage.)"
    >
      <CommunitiesDirectory initialCommunities={list} loadFailed={loadFailed} />
    </CommunitiesPageShell>
  );
}
