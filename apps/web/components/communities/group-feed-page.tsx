'use client';

import { useEffect, useState } from 'react';
import type { CommunityDto, CommunityPostDto } from '@soulsync/shared-types/communities';
import { Button } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { fetchCommunityFeed } from '@/lib/communities-client';
import { isActiveMember } from '@/lib/communities-format';
import { GroupHeader } from './group-header';
import { CommunityGroupNav } from './community-group-nav';
import { GroupAboutSidebar } from './group-about-sidebar';
import { PostComposer } from './post-composer';
import { CommunityPostCard, viewerCanModerate } from './community-post-card';
import { toast } from 'sonner';

type GroupFeedPageProps = {
  initialCommunity: CommunityDto;
};

export function GroupFeedPage({ initialCommunity }: GroupFeedPageProps) {
  const [community, setCommunity] = useState(initialCommunity);
  const [posts, setPosts] = useState<CommunityPostDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const member = isActiveMember(community);
  const [loading, setLoading] = useState(member);
  const [moderationQueue, setModerationQueue] = useState(false);
  const canModerate = viewerCanModerate(community.viewerMembership);

  useEffect(() => {
    if (!member) {
      return;
    }
    let cancelled = false;
    void fetchCommunityFeed(community.slug, { moderationQueue })
      .then((feed) => {
        if (!cancelled) {
          setPosts(feed.items);
          setCursor(feed.nextCursor);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load feed');
          setPosts([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [community.slug, member, moderationQueue]);

  async function loadMore() {
    if (!cursor || !member) {
      return;
    }
    setLoading(true);
    try {
      const feed = await fetchCommunityFeed(community.slug, {
        cursor,
        moderationQueue,
      });
      setPosts((prev) => [...prev, ...feed.items]);
      setCursor(feed.nextCursor);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load feed');
    } finally {
      setLoading(false);
    }
  }

  function handleNewPost(post: CommunityPostDto) {
    if (post.status === 'SCHEDULED') {
      return;
    }
    if (post.status === 'PUBLISHED' && !moderationQueue) {
      setPosts((prev) => [post, ...(prev ?? [])]);
    } else if (moderationQueue && post.status === 'PENDING') {
      setPosts((prev) => [post, ...(prev ?? [])]);
    } else if (post.status === 'PENDING' && !moderationQueue) {
      setPosts((prev) => [post, ...(prev ?? [])]);
    }
  }

  function handleDecided(post: CommunityPostDto) {
    setPosts((prev) => (prev ?? []).filter((p) => p.id !== post.id));
  }

  const safePosts = posts ?? [];

  function switchModerationView(queue: boolean) {
    if (queue === moderationQueue) {
      return;
    }
    setModerationQueue(queue);
    setPosts([]);
    setCursor(null);
    setLoading(true);
  }

  function handleCommunityUpdate(next: CommunityDto) {
    const wasMember = isActiveMember(community);
    const nowMember = isActiveMember(next);
    setCommunity(next);
    if (!wasMember && nowMember) {
      setPosts([]);
      setCursor(null);
      setLoading(true);
    }
  }

  return (
    <div className="space-y-6">
      <GroupHeader community={community} onCommunityUpdate={handleCommunityUpdate} />
      <CommunityGroupNav community={community} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {member ? (
            <>
              {canModerate ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => switchModerationView(false)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium',
                      !moderationQueue
                        ? 'bg-[var(--color-brand-700)] text-white'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
                    )}
                  >
                    Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => switchModerationView(true)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium',
                      moderationQueue
                        ? 'bg-[var(--color-brand-700)] text-white'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
                    )}
                  >
                    Review pending
                  </button>
                </div>
              ) : null}
              {!moderationQueue ? (
                <PostComposer slug={community.slug} onCreated={handleNewPost} />
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              Join this group to see the feed and post updates.
            </div>
          )}

          {member && loading && safePosts.length === 0 ? (
            <p className="text-center text-sm text-[var(--muted-foreground)]">Loading feed…</p>
          ) : null}

          {member && !loading && safePosts.length === 0 ? (
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              {moderationQueue
                ? 'No posts awaiting review.'
                : 'No posts yet. Start the conversation.'}
            </p>
          ) : null}

          <div className="space-y-4">
            {safePosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                slug={community.slug}
                canModerate={canModerate}
                moderationMode={moderationQueue}
                onDecided={handleDecided}
              />
            ))}
          </div>

          {cursor && member ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => void loadMore()}
              >
                {loading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <GroupAboutSidebar community={community} />
        </aside>
      </div>

      <div className="lg:hidden">
        <GroupAboutSidebar community={community} />
      </div>
    </div>
  );
}
