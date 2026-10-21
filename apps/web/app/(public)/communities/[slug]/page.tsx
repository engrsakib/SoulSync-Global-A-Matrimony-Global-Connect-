import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerCommunityDetail, getServerCommunityFeed } from '@/lib/communities-server';
import { isActiveMember } from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';
import { CommunitiesPageShell } from '@/components/communities/communities-page-shell';
import { GroupFeedPage } from '@/components/communities/group-feed-page';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await getServerCommunityDetail(slug);
  return {
    title: community ? `${community.name} | Communities` : 'Community | SoulSync Global',
  };
}

export default async function CommunitySlugPage({ params }: PageProps) {
  const user = await getServerSessionUser();
  if (!user) {
    const { slug } = await params;
    redirect(`/login?next=${encodeURIComponent(memberRoutes.community(slug))}`);
  }

  const { slug } = await params;
  const community = await getServerCommunityDetail(slug);
  if (!community) {
    notFound();
  }

  const initialFeed = isActiveMember(community)
    ? await getServerCommunityFeed(slug)
    : null;

  return (
    <CommunitiesPageShell title="" subtitle="">
      <GroupFeedPage key={slug} initialCommunity={community} initialFeed={initialFeed} />
    </CommunitiesPageShell>
  );
}
