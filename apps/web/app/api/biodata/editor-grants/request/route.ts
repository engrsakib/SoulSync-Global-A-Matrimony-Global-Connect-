import { NextResponse } from 'next/server';
import { proxyAuthPostJson } from '@/lib/api-auth-proxy';
import type { BiodataEditorGrantDto } from '@soulsync/shared-types/biodata-editor-grant';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body: unknown = await request.json().catch(() => ({}));
  try {
    const data = await proxyAuthPostJson<BiodataEditorGrantDto>(
      '/biodata/editor-grants/request',
      body,
      token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
