import { NextResponse } from 'next/server';
import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type RouteContext = { params: Promise<{ photoId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { photoId } = await context.params;

  try {
    const response = await fetch(
      `${apiBaseUrl}/biodata/me/gallery/photos/${encodeURIComponent(photoId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    const raw: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(readApiErrorMessage(raw, 'Delete failed'));
    }
    const photos = unwrapApiPayload<BiodataGalleryPhotoDto[]>(raw);
    return NextResponse.json({ data: photos });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
