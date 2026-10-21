import { NextResponse } from 'next/server';
import { proxyAuthPatch } from '@/lib/api-auth-proxy';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ sectionId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { sectionId } = await context.params;
  const body: unknown = await request.json().catch(() => ({}));

  try {
    const biodata = await proxyAuthPatch<BiodataMeDto>(
      `/biodata/me/sections/${sectionId}`,
      body,
      token,
    );
    return NextResponse.json(biodata);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
