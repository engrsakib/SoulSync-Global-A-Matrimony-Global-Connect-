import type { CommunityPostDto } from '@soulsync/shared-types/communities';

function feedSortKey(post: CommunityPostDto): number {
  return Date.parse(post.createdAt);
}

function compareFeedPosts(a: CommunityPostDto, b: CommunityPostDto): number {
  const byTime = feedSortKey(b) - feedSortKey(a);
  if (byTime !== 0) {
    return byTime;
  }
  if (a.id === b.id) {
    return 0;
  }
  return a.id < b.id ? 1 : -1;
}

export function mergeFeedPosts(
  serverItems: CommunityPostDto[],
  previousItems: CommunityPostDto[],
): CommunityPostDto[] {
  const byId = new Map<string, CommunityPostDto>();
  for (const post of previousItems) {
    byId.set(post.id, post);
  }
  for (const post of serverItems) {
    byId.set(post.id, post);
  }
  return [...byId.values()].sort(compareFeedPosts);
}

export function upsertFeedPost(
  previousItems: CommunityPostDto[],
  post: CommunityPostDto,
): CommunityPostDto[] {
  return mergeFeedPosts([post], previousItems.filter((p) => p.id !== post.id));
}

export function patchFeedPost(
  previousItems: CommunityPostDto[],
  postId: string,
  patch: Partial<CommunityPostDto> | ((post: CommunityPostDto) => CommunityPostDto),
): CommunityPostDto[] {
  return previousItems.map((post) => {
    if (post.id !== postId) {
      return post;
    }
    return typeof patch === 'function' ? patch(post) : { ...post, ...patch };
  });
}

export function shouldShowPostInFeedView(
  post: CommunityPostDto,
  moderationQueue: boolean,
): boolean {
  if (post.status === 'SCHEDULED') {
    return false;
  }
  if (moderationQueue) {
    return post.status === 'PENDING';
  }
  return post.status === 'PUBLISHED' || post.status === 'PENDING';
}
