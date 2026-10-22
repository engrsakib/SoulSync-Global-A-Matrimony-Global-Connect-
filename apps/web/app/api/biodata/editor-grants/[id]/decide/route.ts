import { NextResponse } from 'next/server';
import { proxyAuthPostJson } from '@/lib/api-auth-proxy';
import type { BiodataEditorGrantDto } from '@soulsync/shared-types/biodata-editor-grant';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => ({}));
  try {
    const data = await proxyAuthPostJson<BiodataEditorGrantDto>(
      `/biodata/editor-grants/${encodeURIComponent(id)}/decide`,
      body,
      token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
