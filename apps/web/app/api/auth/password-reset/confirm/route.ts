import { NextResponse } from 'next/server';
import { proxyAuthPost } from '@/lib/api-auth-proxy';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const result = await proxyAuthPost('/auth/password-reset/confirm', body);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
