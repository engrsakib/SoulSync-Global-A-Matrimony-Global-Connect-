import { NextResponse } from 'next/server';
import { proxyAuthPost } from '@/lib/api-auth-proxy';
import { applyAuthCookiesToResponse } from '@/lib/auth-cookie';

export async function POST() {
  try {
    const result = await proxyAuthPost('/auth/guest', {});
    const response = NextResponse.json({
      user: result.user,
      loginCodePlain: result.loginCodePlain,
    });
    applyAuthCookiesToResponse(response, result);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Guest access failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
