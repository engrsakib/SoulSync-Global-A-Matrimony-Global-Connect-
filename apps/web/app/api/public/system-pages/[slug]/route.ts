import { NextResponse } from 'next/server';
import { isSystemPageDto, unwrapApiPayload, type SystemPageDto } from '@soulsync/shared-types';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const response = await fetch(
    `${apiBaseUrl}/public/system-pages/${encodeURIComponent(slug)}`,
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
  );

  if (!response.ok) {
    return NextResponse.json({ message: 'Not found' }, { status: response.status });
  }

  const raw: unknown = await response.json();
  const payload = unwrapApiPayload<SystemPageDto>(raw);
  if (!isSystemPageDto(payload)) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 502 });
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
