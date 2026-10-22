import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { UserActivityLogListDto } from '@soulsync/shared-types/activity-log';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

const FORWARD_PARAMS = ['cursor', 'limit', 'q', 'sort', 'dateFrom', 'dateTo'] as const;

export async function GET(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  for (const key of FORWARD_PARAMS) {
    const value = searchParams.get(key);
    if (value) {
      params.set(key, value);
    }
  }
  for (const type of searchParams.getAll('types')) {
    if (type) {
      params.append('types', type);
    }
  }
  const typesCsv = searchParams.get('types');
  if (typesCsv && !searchParams.getAll('types').length) {
    for (const part of typesCsv.split(',')) {
      const trimmed = part.trim();
      if (trimmed) {
        params.append('types', trimmed);
      }
    }
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
