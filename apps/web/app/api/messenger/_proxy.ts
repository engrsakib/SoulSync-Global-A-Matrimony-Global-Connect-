import { NextResponse } from 'next/server';
import {
  proxyAuthDelete,
  proxyAuthGetWithToken,
  proxyAuthPatch,
  proxyAuthPostJson,
  proxyAuthPut,
} from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export async function withMessengerAuth<T>(
  handler: (token: string) => Promise<T>,
): Promise<NextResponse> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await handler(token);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export {
  proxyAuthDelete,
  proxyAuthGetWithToken,
  proxyAuthPatch,
  proxyAuthPostJson,
  proxyAuthPut,
};
