import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { UserActivityLogListDto } from '@soulsync/shared-types/activity-log';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  const cursor = searchParams.get('cursor');
  const limit = searchParams.get('limit');
  if (cursor) {
    params.set('cursor', cursor);
  }
  if (limit) {
    params.set('limit', limit);
  }
  const qs = params.toString();
  const path = qs ? `/activity-log?${qs}` : '/activity-log';

  try {
    const data = await proxyAuthGetWithToken<UserActivityLogListDto>(path, token);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
