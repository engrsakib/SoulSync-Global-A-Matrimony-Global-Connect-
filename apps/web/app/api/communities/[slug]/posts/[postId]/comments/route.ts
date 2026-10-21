import { NextResponse } from 'next/server';
import type {
  CommunityCommentDto,
  CreateCommunityCommentDto,
} from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesGetWithQuery,
  proxyCommunitiesPost,
  requireCommunitiesToken,
} from '../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; postId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, postId } = await params;
  const { searchParams } = new URL(request.url);

  try {
    const data = await proxyCommunitiesGetWithQuery<{
      items: CommunityCommentDto[];
      nextCursor: string | null;
    }>(communityApiPath(slug, `/posts/${encodeURIComponent(postId)}/comments`), auth.token, {
      cursor: searchParams.get('cursor') ?? undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, postId } = await params;
  const body = (await request.json()) as CreateCommunityCommentDto;

  try {
    const data = await proxyCommunitiesPost<CommunityCommentDto>(
      communityApiPath(slug, `/posts/${encodeURIComponent(postId)}/comments`),
      body,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
