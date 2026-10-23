import { NextResponse } from 'next/server';
import { proxyAuthPatch } from '@/lib/api-auth-proxy';
import type { MarriageRecordDto } from '@soulsync/shared-types/marriage-record';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => ({}));
  try {
    const data = await proxyAuthPatch<MarriageRecordDto>(
      `/marriage-records/${encodeURIComponent(id)}/status`,
      body,
      token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
