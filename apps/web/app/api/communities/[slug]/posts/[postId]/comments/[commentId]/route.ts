import { NextResponse } from 'next/server';
import type {
  CommunityCommentDto,
  PatchCommunityCommentDto,
} from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesDelete,
  proxyCommunitiesPatch,
  requireCommunitiesToken,
} from '../../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; postId: string; commentId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, postId, commentId } = await params;
  const body = (await request.json()) as PatchCommunityCommentDto;

  try {
    const data = await proxyCommunitiesPatch<CommunityCommentDto>(
      communityApiPath(
        slug,
        `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
      ),
      body,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, postId, commentId } = await params;

  try {
    const data = await proxyCommunitiesDelete<CommunityCommentDto>(
      communityApiPath(
        slug,
        `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
      ),
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
