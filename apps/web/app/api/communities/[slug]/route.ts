import { NextResponse } from 'next/server';
import type { CommunityDto, PatchCommunityDto } from '@soulsync/shared-types/communities';
import {
  communitiesErrorResponse,
  proxyCommunitiesDelete,
  proxyCommunitiesGet,
  proxyCommunitiesPatch,
  requireCommunitiesToken,
} from '../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug } = await params;

  try {
    const data = await proxyCommunitiesGet<CommunityDto>(
      `/communities/${encodeURIComponent(slug)}`,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug } = await params;
  const body = (await request.json()) as PatchCommunityDto;

  try {
    const data = await proxyCommunitiesPatch<CommunityDto>(
      `/communities/${encodeURIComponent(slug)}`,
      body,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCommunitiesToken();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { slug } = await params;

  try {
    const data = await proxyCommunitiesDelete<CommunityDto>(
      `/communities/${encodeURIComponent(slug)}`,
      auth.token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return communitiesErrorResponse(error);
  }
}
