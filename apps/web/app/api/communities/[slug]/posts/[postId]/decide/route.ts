import { NextResponse } from 'next/server';
import type { CommunityPostDto, DecideCommunityPostDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesPost,
  requireCommunitiesToken,
} from '../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; postId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, postId } = await params;
  const body = (await request.json()) as DecideCommunityPostDto;

  try {
    const data = await proxyCommunitiesPost<CommunityPostDto>(
      communityApiPath(slug, `/posts/${encodeURIComponent(postId)}/decide`),
      body,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
