import { NextResponse } from 'next/server';
import { proxyAuthPost } from '@/lib/api-auth-proxy';
import { applyAuthCookiesToResponse } from '@/lib/auth-cookie';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const result = await proxyAuthPost('/auth/register', body);
    const response = NextResponse.json({
      user: result.user,
      loginCodePlain: result.loginCodePlain,
    });
    applyAuthCookiesToResponse(response, result);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    const status = message.toLowerCase().includes('already') ? 409 : 400;
    return NextResponse.json({ message }, { status });
  }
}
