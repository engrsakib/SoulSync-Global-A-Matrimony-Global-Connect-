import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type {
  CommunityCommentDto,
  CommunityDto,
  CommunityFeedDto,
  CommunityJoinRequestDto,
  CommunityMemberDto,
  CommunityMemberPostsDto,
  CommunityPostDto,
  CreateCommunityCommentDto,
  CreateCommunityDto,
  CreateCommunityJoinRequestDto,
  CreateCommunityPostDto,
  DecideCommunityJoinRequestDto,
  DecideCommunityPostDto,
  PatchCommunityDto,
  PatchCommunityMemberDto,
  SetCommunityReactionDto,
} from '@soulsync/shared-types/communities';

async function parseJsonResponse<T>(response: Response, fallback: string): Promise<T> {
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, fallback));
  }
  return unwrapApiPayload<T>(raw);
}

function apiPath(path: string): string {
  return `/api/communities${path}`;
}

export async function fetchCommunitiesList(): Promise<CommunityDto[]> {
  const response = await fetch(apiPath(''), { cache: 'no-store' });
  return parseJsonResponse<CommunityDto[]>(response, 'Could not load communities');
}

export async function createCommunity(body: CreateCommunityDto): Promise<CommunityDto> {
  const response = await fetch(apiPath(''), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<CommunityDto>(response, 'Could not create community');
}

export async function fetchCommunityDetail(slug: string): Promise<CommunityDto> {
  const response = await fetch(apiPath(`/${encodeURIComponent(slug)}`), { cache: 'no-store' });
  return parseJsonResponse<CommunityDto>(response, 'Community not found');
}

export async function patchCommunity(slug: string, body: PatchCommunityDto): Promise<CommunityDto> {
  const response = await fetch(apiPath(`/${encodeURIComponent(slug)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<CommunityDto>(response, 'Could not update community');
}

export async function fetchCommunityMembers(slug: string): Promise<CommunityMemberDto[]> {
  const response = await fetch(apiPath(`/${encodeURIComponent(slug)}/members`), {
    cache: 'no-store',
  });
  const data = await parseJsonResponse<CommunityMemberDto[]>(response, 'Could not load members');
  return Array.isArray(data) ? data : [];
}

export async function patchCommunityMember(
  slug: string,
  userId: string,
  body: PatchCommunityMemberDto,
): Promise<CommunityMemberDto> {
  const response = await fetch(
    apiPath(`/${encodeURIComponent(slug)}/members/manage/${encodeURIComponent(userId)}`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return parseJsonResponse<CommunityMemberDto>(response, 'Could not update member');
}

export async function removeCommunityMember(
  slug: string,
  userId: string,
): Promise<CommunityMemberDto> {
  const response = await fetch(
    apiPath(`/${encodeURIComponent(slug)}/members/manage/${encodeURIComponent(userId)}/remove`),
    { method: 'POST' },
  );
  return parseJsonResponse<CommunityMemberDto>(response, 'Could not remove member');
}

export async function fetchJoinRequests(slug: string): Promise<CommunityJoinRequestDto[]> {
  const response = await fetch(apiPath(`/${encodeURIComponent(slug)}/join-requests`), {
    cache: 'no-store',
  });
  const data = await parseJsonResponse<CommunityJoinRequestDto[]>(
    response,
    'Could not load join requests',
  );
  return Array.isArray(data) ? data : [];
}

export async function decideJoinRequest(
  slug: string,
  requestId: string,
  body: DecideCommunityJoinRequestDto,
): Promise<CommunityJoinRequestDto> {
  const response = await fetch(
    apiPath(
      `/${encodeURIComponent(slug)}/join-requests/${encodeURIComponent(requestId)}/decide`,
    ),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return parseJsonResponse<CommunityJoinRequestDto>(response, 'Could not decide request');
}

export async function joinCommunity(
  slug: string,
  body: CreateCommunityJoinRequestDto = {},
): Promise<CommunityDto | CommunityJoinRequestDto> {
  const response = await fetch(apiPath(`/${encodeURIComponent(slug)}/join`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<CommunityDto | CommunityJoinRequestDto>(response, 'Could not join');
}

function normalizeCommunityFeed(feed: CommunityFeedDto | null | undefined): CommunityFeedDto {
  if (!feed || typeof feed !== 'object') {
    return { items: [], nextCursor: null, pendingCount: null };
  }
  return {
    items: Array.isArray(feed.items) ? feed.items : [],
    nextCursor: feed.nextCursor ?? null,
    pendingCount: feed.pendingCount ?? null,
  };
}

export async function fetchCommunityFeed(
  slug: string,
  options: { cursor?: string; moderationQueue?: boolean } = {},
): Promise<CommunityFeedDto> {
  const params = new URLSearchParams();
  if (options.cursor) {
    params.set('cursor', options.cursor);
  }
  if (options.moderationQueue) {
    params.set('moderationQueue', 'true');
  }
  const qs = params.toString();
  const response = await fetch(
    apiPath(`/${encodeURIComponent(slug)}/posts${qs ? `?${qs}` : ''}`),
    { cache: 'no-store' },
  );
  const feed = await parseJsonResponse<CommunityFeedDto>(response, 'Could not load feed');
  return normalizeCommunityFeed(feed);
}

export async function createCommunityPost(
  slug: string,
  body: CreateCommunityPostDto,
): Promise<CommunityPostDto> {
  const response = await fetch(apiPath(`/${encodeURIComponent(slug)}/posts`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<CommunityPostDto>(response, 'Could not create post');
}

export async function decideCommunityPost(
  slug: string,
  postId: string,
  body: DecideCommunityPostDto,
): Promise<CommunityPostDto> {
  const response = await fetch(
    apiPath(`/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}/decide`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return parseJsonResponse<CommunityPostDto>(response, 'Could not decide post');
}

export async function fetchPostComments(
  slug: string,
  postId: string,
  cursor?: string,
): Promise<{ items: CommunityCommentDto[]; nextCursor: string | null }> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const response = await fetch(
    apiPath(`/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}/comments${params}`),
    { cache: 'no-store' },
  );
  return parseJsonResponse(response, 'Could not load comments');
}

export async function createPostComment(
  slug: string,
  postId: string,
  body: CreateCommunityCommentDto,
): Promise<CommunityCommentDto> {
  const response = await fetch(
    apiPath(`/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}/comments`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return parseJsonResponse<CommunityCommentDto>(response, 'Could not post comment');
}

export async function setPostReaction(
  slug: string,
  postId: string,
  body: SetCommunityReactionDto,
): Promise<void> {
  const response = await fetch(
    apiPath(`/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}/reactions`),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  await parseJsonResponse<{ ok: true }>(response, 'Could not react');
}

export async function clearPostReaction(slug: string, postId: string): Promise<void> {
  const response = await fetch(
    apiPath(`/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}/reactions`),
    { method: 'DELETE' },
  );
  await parseJsonResponse<{ ok: true }>(response, 'Could not clear reaction');
}

export async function fetchCommunityMember(
  slug: string,
  username: string,
): Promise<CommunityMemberDto> {
  const response = await fetch(
    apiPath(`/${encodeURIComponent(slug)}/members/${encodeURIComponent(username)}`),
    { cache: 'no-store' },
  );
  return parseJsonResponse<CommunityMemberDto>(response, 'Member not found');
}

export async function fetchMemberPosts(
  slug: string,
  username: string,
  cursor?: string,
): Promise<CommunityMemberPostsDto> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const response = await fetch(
    apiPath(
      `/${encodeURIComponent(slug)}/members/${encodeURIComponent(username)}/posts${params}`,
    ),
    { cache: 'no-store' },
  );
  const data = await parseJsonResponse<CommunityMemberPostsDto>(response, 'Could not load posts');
  return {
    ...data,
    feed: normalizeCommunityFeed(data?.feed),
  };
}
