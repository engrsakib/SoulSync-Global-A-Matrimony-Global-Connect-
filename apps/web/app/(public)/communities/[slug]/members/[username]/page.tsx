import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSessionUser } from '@/lib/auth-server';
import { getServerCommunityDetail } from '@/lib/communities-server';
import { memberRoutes } from '@/lib/member-routes';
import { CommunitiesPageShell } from '@/components/communities/communities-page-shell';
import { MemberPostsPage } from '@/components/communities/member-posts-page';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string; username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} | Groups` };
}

export default async function CommunityMemberPage({ params }: PageProps) {
  const user = await getServerSessionUser();
  const { slug, username } = await params;

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(memberRoutes.communityMember(slug, username))}`);
  }

  const community = await getServerCommunityDetail(slug);
  if (!community) {
    notFound();
  }

  return (
    <CommunitiesPageShell title="" subtitle="">
      <MemberPostsPage community={community} username={username} />
    </CommunitiesPageShell>
  );
}
