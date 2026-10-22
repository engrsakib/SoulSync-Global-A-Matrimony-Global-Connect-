import { NextResponse } from 'next/server';
import type { CommunityCommentDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesGet,
  requireCommunitiesToken,
} from '../../../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; postId: string; commentId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, postId, commentId } = await params;

  try {
    const data = await proxyCommunitiesGet<CommunityCommentDto[]>(
      communityApiPath(
        slug,
        `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies`,
      ),
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
