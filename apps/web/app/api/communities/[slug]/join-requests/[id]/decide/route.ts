import { NextResponse } from 'next/server';
import type {
  CommunityJoinRequestDto,
  DecideCommunityJoinRequestDto,
} from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesPost,
  requireCommunitiesToken,
} from '../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, id } = await params;
  const body = (await request.json()) as DecideCommunityJoinRequestDto;

  try {
    const data = await proxyCommunitiesPost<CommunityJoinRequestDto>(
      communityApiPath(slug, `/join-requests/${encodeURIComponent(id)}/decide`),
      body,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
