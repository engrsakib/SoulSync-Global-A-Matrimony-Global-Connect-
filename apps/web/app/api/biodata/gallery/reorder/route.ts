import { NextResponse } from 'next/server';
import { proxyAuthPatch } from '@/lib/api-auth-proxy';
import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const photos = await proxyAuthPatch<BiodataGalleryPhotoDto[]>(
      '/biodata/me/gallery/reorder',
      body,
      token,
    );
    return NextResponse.json({ data: photos });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reorder failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
