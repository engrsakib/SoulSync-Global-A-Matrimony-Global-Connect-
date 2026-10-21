import { NextResponse } from 'next/server';
import type { GeoStateOption } from '@soulsync/shared-types/geo';
import { proxyGeoGet } from '@/lib/geo-proxy';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ alpha2: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { alpha2 } = await context.params;
  try {
    const states = await proxyGeoGet<GeoStateOption[]>(
      `/geo/countries/${encodeURIComponent(alpha2)}/states`,
    );
    return NextResponse.json(states);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Geo request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
