import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerCommunityDetail } from '@/lib/communities-server';
import { memberRoutes } from '@/lib/member-routes';
import { CommunitiesPageShell } from '@/components/communities/communities-page-shell';
import { GroupMembersPage } from '@/components/communities/group-members-page';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await getServerCommunityDetail(slug);
  return {
    title: community ? `Members · ${community.name}` : 'Members | Communities',
  };
}

export default async function CommunityMembersPage({ params }: PageProps) {
  const user = await getServerSessionUser();
  if (!user) {
    const { slug } = await params;
    redirect(`/login?next=${encodeURIComponent(memberRoutes.communityMembers(slug))}`);
  }

  const { slug } = await params;
  const community = await getServerCommunityDetail(slug);
  if (!community) {
    notFound();
  }

  return (
    <CommunitiesPageShell title="" subtitle="">
      <GroupMembersPage key={slug} initialCommunity={community} />
    </CommunitiesPageShell>
  );
}
