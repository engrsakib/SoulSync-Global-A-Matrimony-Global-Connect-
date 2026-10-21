import { NextResponse } from 'next/server';
import type { CommunityMemberDto, PatchCommunityMemberDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesPatch,
  requireCommunitiesToken,
} from '../../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; userId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug, userId } = await params;
  const body = (await request.json()) as PatchCommunityMemberDto;

  try {
    const data = await proxyCommunitiesPatch<CommunityMemberDto>(
      communityApiPath(slug, `/members/${encodeURIComponent(userId)}`),
      body,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
