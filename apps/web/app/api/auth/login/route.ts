import { NextResponse } from 'next/server';
import { proxyAuthPost } from '@/lib/api-auth-proxy';
import { applyAuthCookiesToResponse } from '@/lib/auth-cookie';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const result = await proxyAuthPost('/auth/login', body);
    const response = NextResponse.json({
      user: result.user,
      loginCodePlain: result.loginCodePlain,
    });
    applyAuthCookiesToResponse(response, result);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ message }, { status: 401 });
  }
}
