import { NextResponse } from 'next/server';
import type { CommunityMemberDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesPost,
  requireCommunitiesToken,
} from '../../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; userId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, userId } = await params;

  try {
    const data = await proxyCommunitiesPost<CommunityMemberDto>(
      communityApiPath(slug, `/members/${encodeURIComponent(userId)}/remove`),
      {},
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
