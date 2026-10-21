import { NextResponse } from 'next/server';
import type {
  CommunityDto,
  CommunityJoinRequestDto,
  CreateCommunityJoinRequestDto,
} from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesPost,
  requireCommunitiesToken,
} from '../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as CreateCommunityJoinRequestDto;

  try {
    const data = await proxyCommunitiesPost<CommunityDto | CommunityJoinRequestDto>(
      communityApiPath(slug, '/join'),
      body,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
