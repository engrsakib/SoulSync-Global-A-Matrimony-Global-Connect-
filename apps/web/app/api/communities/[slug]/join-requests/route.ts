import { NextResponse } from 'next/server';
import type { CommunityJoinRequestDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesGet,
  requireCommunitiesToken,
} from '../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug } = await params;

  try {
    const data = await proxyCommunitiesGet<CommunityJoinRequestDto[]>(
      communityApiPath(slug, '/join-requests'),
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
