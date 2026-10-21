'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import type { CommunityDto, CommunityMemberDto, CommunityPostDto } from '@soulsync/shared-types/communities';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { Button } from '@soulsync/ui/button';
import { fetchMemberPosts } from '@/lib/communities-client';
import { formatCommunityAuthorUsername } from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';
import { CommunityPostCard } from './community-post-card';
import { toast } from 'sonner';

type MemberPostsPageProps = {
  community: CommunityDto;
  username: string;
};

export function MemberPostsPage({ community, username }: MemberPostsPageProps) {
  const [member, setMember] = useState<CommunityMemberDto | null>(null);
  const [posts, setPosts] = useState<CommunityPostDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchMemberPosts(community.slug, username)
      .then((data) => {
        if (!cancelled) {
          setMember(data.member);
          setPosts(data.feed.items);
          setCursor(data.feed.nextCursor);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load profile');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [community.slug, username]);

  async function loadMore() {
    if (!cursor) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMemberPosts(community.slug, username, cursor);
      setMember(data.member);
      setPosts((prev) => [...prev, ...data.feed.items]);
      setCursor(data.feed.nextCursor);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load posts');
    } finally {
      setLoading(false);
    }
  }

  const displayName = formatCommunityAuthorUsername(member?.username ?? username);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={memberRoutes.community(community.slug)}
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to {community.name}
      </Link>

      <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-4 shadow-sm">
        <Avatar className="h-14 w-14">
          {member?.avatarUrl ? (
            <Image src={member.avatarUrl} alt="" width={56} height={56} className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">{displayName}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Posts in {community.name}
            {member?.role ? ` · ${member.role.toLowerCase()}` : ''}
          </p>
        </div>
      </div>

      {loading && posts.length === 0 ? (
        <p className="text-center text-sm text-[var(--muted-foreground)]">Loading…</p>
      ) : null}

      <div className="space-y-4">
        {posts.map((post) => (
          <CommunityPostCard key={post.id} post={post} slug={community.slug} readOnlySocial />
        ))}
      </div>

      {cursor ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" disabled={loading} onClick={() => void loadMore()}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
