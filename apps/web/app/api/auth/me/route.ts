import { NextResponse } from 'next/server';
import { proxyAuthGetMe } from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await proxyAuthGetMe(token);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
