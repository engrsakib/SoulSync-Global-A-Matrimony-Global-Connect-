import { NextResponse } from 'next/server';
import type { CommunityFeedDto, CommunityPostDto, CreateCommunityPostDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  communityApiPath,
  proxyCommunitiesGetWithQuery,
  proxyCommunitiesPost,
  requireCommunitiesToken,
} from '../../_proxy';

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
    const data = await proxyCommunitiesGetWithQuery<CommunityFeedDto>(
      communityApiPath(slug, '/posts'),
      auth.token,
      {
        cursor: searchParams.get('cursor') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
        moderationQueue: searchParams.get('moderationQueue') ?? undefined,
      },
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug } = await params;
  const body = (await request.json()) as CreateCommunityPostDto;

  try {
    const data = await proxyCommunitiesPost<CommunityPostDto>(
      communityApiPath(slug, '/posts'),
      body,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
