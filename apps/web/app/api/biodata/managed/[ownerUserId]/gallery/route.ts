import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ ownerUserId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { ownerUserId } = await context.params;
  try {
    const photos = await proxyAuthGetWithToken<BiodataGalleryPhotoDto[]>(
      `/biodata/managed/${encodeURIComponent(ownerUserId)}/gallery`,
      token,
    );
    return NextResponse.json({ data: photos });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
