import { NextResponse } from 'next/server';
import { proxyAuthPut } from '@/lib/api-auth-proxy';
import type { MarriageRecordDto } from '@soulsync/shared-types/marriage-record';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slotIndex: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { slotIndex } = await context.params;
  const body: unknown = await request.json().catch(() => ({}));
  try {
    const data = await proxyAuthPut<MarriageRecordDto>(
      `/marriage-records/slots/${encodeURIComponent(slotIndex)}`,
      body,
      token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
