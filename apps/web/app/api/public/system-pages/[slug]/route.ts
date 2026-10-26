import { NextResponse } from 'next/server';
import { isSystemPageDto, unwrapApiPayload, type SystemPageDto } from '@soulsync/shared-types';
import { loadSystemPageFromSeed } from '@/lib/system-pages/load-seed-page';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const response = await fetch(
    `${apiBaseUrl}/public/system-pages/${encodeURIComponent(slug)}`,
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
  );

  let payload: SystemPageDto | null = null;
  if (response.ok) {
    const raw: unknown = await response.json();
    const unwrapped = unwrapApiPayload<SystemPageDto>(raw);
    payload = isSystemPageDto(unwrapped) ? unwrapped : null;
  }

  if (!payload) {
    payload = loadSystemPageFromSeed(slug);
  }

  if (!payload) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
