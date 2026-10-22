import { NextResponse } from 'next/server';
import { proxyAuthPostJson } from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function POST() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await proxyAuthPostJson<{ updated: number }>('/notifications/read-all', {}, token);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
