import { NextResponse } from 'next/server';
import { clearAuthCookiesOnResponse } from '@/lib/auth-cookie';

export function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookiesOnResponse(response);
  return response;
}
