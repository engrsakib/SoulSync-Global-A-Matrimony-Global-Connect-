import { NextResponse } from 'next/server';
import { proxyAuthPatch } from '@/lib/api-auth-proxy';
import type { PublicUser } from '@/lib/auth-api';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

function errorStatus(message: string): number {
  const lower = message.toLowerCase();
  if (lower.includes('unauthorized') || lower.includes('incorrect')) {
    return 401;
  }
  if (lower.includes('already') || lower.includes('taken')) {
    return 409;
  }
  return 400;
}

export async function PATCH(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const user = await proxyAuthPatch<PublicUser>('/auth/me/username', body, token);
    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ message }, { status: errorStatus(message) });
  }
}
