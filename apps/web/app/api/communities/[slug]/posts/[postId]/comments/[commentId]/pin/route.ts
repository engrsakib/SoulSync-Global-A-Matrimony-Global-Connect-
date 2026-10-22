import { NextResponse } from 'next/server';
import type {
  CommunityCommentDto,
  PinCommunityCommentDto,
} from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesPost,
  requireCommunitiesToken,
} from '../../../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; postId: string; commentId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, postId, commentId } = await params;
  const body = (await request.json()) as PinCommunityCommentDto;

  try {
    const data = await proxyCommunitiesPost<CommunityCommentDto>(
      communityApiPath(
        slug,
        `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/pin`,
      ),
      body,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
