'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  CommunityDto,
  CommunityFeedDto,
  CommunityPostDto,
} from '@soulsync/shared-types/communities';
import { Button } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { fetchCommunityFeed } from '@/lib/communities-client';
import {
  filterPostsForFeedView,
  mergeFeedPosts,
  normalizeCommunityFeed,
  patchFeedPost,
  shouldShowPostInFeedView,
  upsertFeedPost,
} from '@/lib/communities-feed-state';
import { isActiveMember } from '@/lib/communities-format';
import { GroupHeader } from './group-header';
import { CommunityGroupNav } from './community-group-nav';
import { GroupAboutSidebar } from './group-about-sidebar';
import { PostComposer } from './post-composer';
import { CommunityPostCard, viewerCanModerate } from './community-post-card';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/use-current-user';

type GroupFeedPageProps = {
  initialCommunity: CommunityDto;
  initialFeed?: CommunityFeedDto | null;
};

export function GroupFeedPage({ initialCommunity, initialFeed }: GroupFeedPageProps) {
  const { user } = useCurrentUser();
  const normalizedInitialFeed = normalizeCommunityFeed(initialFeed);
  const [community, setCommunity] = useState(initialCommunity);
  const [posts, setPosts] = useState<CommunityPostDto[]>(() => normalizedInitialFeed.items);
  const [cursor, setCursor] = useState<string | null>(() => normalizedInitialFeed.nextCursor);
  const member = isActiveMember(community);
  const [loading, setLoading] = useState(
    () => member && normalizedInitialFeed.items.length === 0,
  );
  const [moderationQueue, setModerationQueue] = useState(false);
  const canModerate = viewerCanModerate(community.viewerMembership);
  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    if (!member) {
      return;
    }
    const generation = ++fetchGenerationRef.current;
    let cancelled = false;
    void fetchCommunityFeed(community.slug, { moderationQueue })
      .then((feed) => {
        if (cancelled || generation !== fetchGenerationRef.current) {
          return;
        }
        setPosts((prev) => mergeFeedPosts(feed.items, prev));
        setCursor(feed.nextCursor);
      })
      .catch((error: unknown) => {
        if (cancelled || generation !== fetchGenerationRef.current) {
          return;
        }
        toast.error(error instanceof Error ? error.message : 'Could not load feed');
      })
      .finally(() => {
        if (!cancelled && generation === fetchGenerationRef.current) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [community.slug, member, moderationQueue]);

  function syncFeedFromServer(feed: CommunityFeedDto) {
    setPosts((prev) => mergeFeedPosts(feed.items, prev));
    setCursor(feed.nextCursor);
    setLoading(false);
  }

  async function loadMore() {
    if (!cursor || !member) {
      return;
    }
    const generation = fetchGenerationRef.current;
    setLoading(true);
    try {
      const feed = await fetchCommunityFeed(community.slug, {
        cursor,
        moderationQueue,
      });
      if (generation !== fetchGenerationRef.current) {
        return;
      }
      setPosts((prev) => mergeFeedPosts(feed.items, prev));
      setCursor(feed.nextCursor);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load feed');
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }

  function handleNewPost(post: CommunityPostDto) {
    if (shouldShowPostInFeedView(post, moderationQueue)) {
      setPosts((prev) => upsertFeedPost(prev ?? [], post));
    }
    setLoading(false);
    const generation = fetchGenerationRef.current;
    void fetchCommunityFeed(community.slug, { moderationQueue })
      .then((feed) => {
        if (generation !== fetchGenerationRef.current) {
          return;
        }
        syncFeedFromServer(feed);
      })
      .catch(() => {
        /* keep optimistic row */
      });
  }

  function handleDecided(post: CommunityPostDto) {
    setPosts((prev) => (prev ?? []).filter((p) => p.id !== post.id));
  }

  function updatePost(
    postId: string,
    patch: Partial<CommunityPostDto> | ((post: CommunityPostDto) => CommunityPostDto),
  ) {
    setPosts((prev) => patchFeedPost(prev ?? [], postId, patch));
  }

  function handlePostRemoved(postId: string) {
    setPosts((prev) => (prev ?? []).filter((p) => p.id !== postId));
  }

  const safePosts = filterPostsForFeedView(posts ?? [], moderationQueue);

  function switchModerationView(queue: boolean) {
    if (queue === moderationQueue) {
      return;
    }
    fetchGenerationRef.current += 1;
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
      fetchGenerationRef.current += 1;
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
                viewerUserId={user?.id}
                viewerRole={community.viewerMembership?.role ?? null}
                onDecided={handleDecided}
                onPostUpdate={updatePost}
                onPostRemoved={handlePostRemoved}
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
