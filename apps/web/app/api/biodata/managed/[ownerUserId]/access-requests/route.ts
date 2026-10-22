import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { BiodataAccessRequestListDto } from '@soulsync/shared-types/biodata-visibility';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ ownerUserId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { ownerUserId } = await context.params;
  try {
    const list = await proxyAuthGetWithToken<BiodataAccessRequestListDto>(
      `/biodata/managed/${encodeURIComponent(ownerUserId)}/access-requests`,
      token,
    );
    return NextResponse.json({ data: list });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
