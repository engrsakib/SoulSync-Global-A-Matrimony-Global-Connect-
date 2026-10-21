import { NextResponse } from 'next/server';
import type { CommunityMemberDto } from '@soulsync/shared-types/communities';
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
    const data = await proxyCommunitiesGet<CommunityMemberDto[]>(
      communityApiPath(slug, '/members'),
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
