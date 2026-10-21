import { NextResponse } from 'next/server';
import type { CommunityDto, CreateCommunityDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  proxyCommunitiesGet,
  proxyCommunitiesPost,
  requireCommunitiesToken,
} from './_proxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const data = await proxyCommunitiesGet<CommunityDto[]>('/communities', auth.token);
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json()) as CreateCommunityDto;

  try {
    const data = await proxyCommunitiesPost<CommunityDto>('/communities', body, auth.token);
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
