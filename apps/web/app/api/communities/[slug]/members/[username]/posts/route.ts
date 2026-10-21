import { NextResponse } from 'next/server';
import type { CommunityMemberPostsDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesGetWithQuery,
  requireCommunitiesToken,
} from '../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; username: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, username } = await params;
  const { searchParams } = new URL(request.url);

  try {
    const data = await proxyCommunitiesGetWithQuery<CommunityMemberPostsDto>(
      communityApiPath(slug, `/members/${encodeURIComponent(username)}/posts`),
      auth.token,
      { cursor: searchParams.get('cursor') ?? undefined },
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
