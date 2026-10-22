import { NextResponse } from 'next/server';
import type { CommunityMemberDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesGetWithQuery,
  requireCommunitiesToken,
} from '../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  try {
    const data = await proxyCommunitiesGetWithQuery<CommunityMemberDto[]>(
      communityApiPath(slug, '/members/search'),
      auth.token,
      { q: searchParams.get('q') ?? undefined },
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
