import { NextResponse } from 'next/server';
import { proxyAuthPostMultipart } from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export type MediaUploadResult = {
  url: string;
  publicId: string;
  resourceType: 'image' | 'raw';
  bytes: number;
};

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

    const result = await proxyAuthPostMultipart<MediaUploadResult>(
      '/media/upload',
      formData,
      token,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ message }, { status: errorStatus(message) });
  }
}
