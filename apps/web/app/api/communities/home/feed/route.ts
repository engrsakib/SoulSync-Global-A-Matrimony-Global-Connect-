import { NextResponse } from 'next/server';
import type { CommunityFeedDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  proxyCommunitiesGetWithQuery,
  requireCommunitiesToken,
} from '../../_proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);

  try {
    const data = await proxyCommunitiesGetWithQuery<CommunityFeedDto>(
      '/communities/home/feed',
      auth.token,
      {
        cursor: searchParams.get('cursor') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
      },
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
