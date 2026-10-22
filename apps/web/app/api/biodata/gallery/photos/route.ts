import { NextResponse } from 'next/server';
import { proxyAuthPostMultipart } from '@/lib/api-auth-proxy';
import type { BiodataGalleryPhotoDto } from '@soulsync/shared-types/biodata-gallery';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

function errorStatus(message: string): number {
  const lower = message.toLowerCase();
  if (lower.includes('unauthorized') || lower.includes('missing access')) {
    return 401;
  }
  if (lower.includes('not configured')) {
    return 503;
  }
  return 400;
}

export async function POST(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const incoming = await request.formData();
    const file = incoming.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'File is required' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('file', file);

    const photo = await proxyAuthPostMultipart<BiodataGalleryPhotoDto>(
      '/biodata/me/gallery/photos',
      formData,
      token,
    );
    return NextResponse.json({ data: photo });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ message }, { status: errorStatus(message) });
  }
}
