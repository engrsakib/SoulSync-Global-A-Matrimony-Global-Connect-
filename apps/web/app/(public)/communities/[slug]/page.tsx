import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerCommunityDetail } from '@/lib/communities-server';
import { memberRoutes } from '@/lib/member-routes';
import { CommunitiesPageShell } from '@/components/communities/communities-page-shell';
import { GroupFeedPage } from '@/components/communities/group-feed-page';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await getServerCommunityDetail(slug);
  return {
    title: community ? `${community.name} | Groups` : 'Group | SoulSync Global',
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

  return (
    <CommunitiesPageShell title="" subtitle="">
      <GroupFeedPage initialCommunity={community} />
    </CommunitiesPageShell>
  );
}
