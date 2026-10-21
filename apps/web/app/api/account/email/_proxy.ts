import { NextResponse } from 'next/server';
import { proxyAuthPostJson } from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export async function proxyEmailRoute<T>(
  nestPath: string,
  request: Request,
): Promise<NextResponse> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json().catch(() => ({}));
    const result = await proxyAuthPostJson<T>(nestPath, body, token);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const status = message.toLowerCase().includes('unauthorized')
      ? 401
      : message.toLowerCase().includes('already') || message.toLowerCase().includes('in use')
        ? 409
        : message.toLowerCase().includes('too many')
          ? 429
          : 400;
    return NextResponse.json({ message }, { status });
  }
}
