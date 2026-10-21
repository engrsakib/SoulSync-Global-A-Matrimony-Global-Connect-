import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CommunityPostShareDto } from '@soulsync/shared-types/communities';
import { memberRoutes } from '@/lib/member-routes';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ shareToken: string }> };

async function fetchShare(token: string): Promise<CommunityPostShareDto | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
  try {
    const res = await fetch(`${apiBaseUrl}/community-posts/share/${encodeURIComponent(token)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return null;
    }
    const raw: unknown = await res.json();
    if (typeof raw === 'object' && raw !== null && 'data' in raw) {
      return (raw as { data: CommunityPostShareDto }).data;
    }
    return raw as CommunityPostShareDto;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = await params;
  const share = await fetchShare(shareToken);
  if (!share) {
    return { title: 'Post not found' };
  }
  const author = share.authorUsername ? `@${share.authorUsername}` : 'Member';
  return {
    title: `${author} in ${share.communityName}`,
    description: share.excerpt ?? undefined,
  };
}

export default async function SharedCommunityPostPage({ params }: PageProps) {
  const { shareToken } = await params;
  const share = await fetchShare(shareToken);
  if (!share) {
    notFound();
  }

  const author = share.authorUsername ? `@${share.authorUsername}` : 'Member';
  const communityHref = memberRoutes.community(share.communitySlug);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-sm">
        <div className="space-y-3 p-6">
          <p className="text-sm text-[var(--muted-foreground)]">
            Shared from{' '}
            <Link
              href={communityHref}
              className="font-medium text-[var(--color-brand-700)] hover:underline"
            >
              {share.communityName}
            </Link>
          </p>
          <h1 className="text-lg font-semibold">{author}</h1>
          {share.excerpt ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{share.excerpt}</p>
          ) : null}
          {share.imageUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--muted)]">
              <Image src={share.imageUrl} alt="" fill className="object-cover" sizes="512px" />
            </div>
          ) : null}
          <Link
            href={communityHref}
            className="inline-flex rounded-full bg-[var(--color-brand-700)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-800)]"
          >
            View community
          </Link>
        </div>
      </article>
    </div>
  );
}
