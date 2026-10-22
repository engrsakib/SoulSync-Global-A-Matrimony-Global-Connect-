import { NextResponse } from 'next/server';
import { proxyAuthPostMultipart } from '@/lib/api-auth-proxy';
import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ ownerUserId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { ownerUserId } = await context.params;
  const formData = await request.formData();
  try {
    const photo = await proxyAuthPostMultipart<BiodataGalleryPhotoDto>(
      `/biodata/managed/${encodeURIComponent(ownerUserId)}/gallery/photos`,
      formData,
      token,
    );
    return NextResponse.json({ data: photo });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
