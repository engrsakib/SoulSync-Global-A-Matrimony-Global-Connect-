import { NextResponse } from 'next/server';
import { proxyAuthPost } from '@/lib/api-auth-proxy';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const result = await proxyAuthPost('/auth/password-reset/request', body);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const status = message.includes('Too many') ? 429 : 400;
    return NextResponse.json({ message }, { status });
  }
}
