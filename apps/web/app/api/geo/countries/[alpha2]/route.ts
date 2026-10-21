import { NextResponse } from 'next/server';
import type { GeoCountryDetail } from '@soulsync/shared-types/geo';
import { proxyGeoGet } from '@/lib/geo-proxy';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ alpha2: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { alpha2 } = await context.params;
  try {
    const detail = await proxyGeoGet<GeoCountryDetail>(
      `/geo/countries/${encodeURIComponent(alpha2)}`,
    );
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Geo request failed';
    const status = message.toLowerCase().includes('not found') ? 404 : 502;
    return NextResponse.json({ message }, { status });
  }
}
