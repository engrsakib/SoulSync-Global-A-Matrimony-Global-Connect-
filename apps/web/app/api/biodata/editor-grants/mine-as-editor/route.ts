import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { BiodataEditorGrantEditorListDto } from '@soulsync/shared-types/biodata-editor-grant';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await proxyAuthGetWithToken<BiodataEditorGrantEditorListDto>(
      '/biodata/editor-grants/mine-as-editor',
      token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
