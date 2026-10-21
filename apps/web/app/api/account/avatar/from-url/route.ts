import { NextResponse } from 'next/server';
import { proxyAuthPostJson } from '@/lib/api-auth-proxy';
import type { PublicUser } from '@/lib/auth-api';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

function errorStatus(message: string): number {
  const lower = message.toLowerCase();
  if (lower.includes('unauthorized') || lower.includes('missing access')) {
    return 401;
  }
  if (lower.includes('not configured')) {
    return 503;
  }
  return 400;
}

export async function POST(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const user = await proxyAuthPostJson<PublicUser>('/auth/me/avatar/from-url', body, token);
    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ message }, { status: errorStatus(message) });
  }
}
