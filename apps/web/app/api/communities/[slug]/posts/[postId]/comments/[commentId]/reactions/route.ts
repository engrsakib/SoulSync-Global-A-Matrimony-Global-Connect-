import { NextResponse } from 'next/server';
import type { SetCommunityReactionDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesDelete,
  proxyCommunitiesPut,
  requireCommunitiesToken,
} from '../../../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; postId: string; commentId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, postId, commentId } = await params;
  const body = (await request.json()) as SetCommunityReactionDto;

  try {
    const data = await proxyCommunitiesPut<{ ok: true }>(
      communityApiPath(
        slug,
        `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/reactions`,
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
    const data = await proxyCommunitiesDelete<{ ok: true }>(
      communityApiPath(
        slug,
        `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/reactions`,
      ),
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
