import { NextResponse } from 'next/server';
import type { CommunityPostDto, PatchCommunityPostDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesDelete,
  proxyCommunitiesPatch,
  requireCommunitiesToken,
} from '../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; postId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, postId } = await params;
  const body = (await request.json()) as PatchCommunityPostDto;

  try {
    const data = await proxyCommunitiesPatch<CommunityPostDto>(
      communityApiPath(slug, `/posts/${encodeURIComponent(postId)}`),
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

  const { slug, postId } = await params;

  try {
    const data = await proxyCommunitiesDelete<CommunityPostDto>(
      communityApiPath(slug, `/posts/${encodeURIComponent(postId)}`),
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
