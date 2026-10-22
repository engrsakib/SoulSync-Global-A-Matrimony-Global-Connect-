import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
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
    const biodata = await proxyAuthGetWithToken<BiodataMeDto>(
      `/biodata/managed/${encodeURIComponent(ownerUserId)}/me`,
      token,
    );
    return NextResponse.json(biodata);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const status = message.toLowerCase().includes('forbidden') ? 403 : 502;
    return NextResponse.json({ message }, { status });
  }
}
