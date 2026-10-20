import { NextResponse } from 'next/server';
import { getApiHealth } from '@/lib/api';

export async function GET() {
  try {
    const health = await getApiHealth();
    return NextResponse.json({ status: 'ok', api: health });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'degraded', error: message }, { status: 503 });
  }
}
