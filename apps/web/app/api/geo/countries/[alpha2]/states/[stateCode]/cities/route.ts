import { NextResponse } from 'next/server';
import type { GeoCityOption } from '@soulsync/shared-types/geo';
import { proxyGeoGet } from '@/lib/geo-proxy';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ alpha2: string; stateCode: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { alpha2, stateCode } = await context.params;
  try {
    const cities = await proxyGeoGet<GeoCityOption[]>(
      `/geo/countries/${encodeURIComponent(alpha2)}/states/${encodeURIComponent(stateCode)}/cities`,
    );
    return NextResponse.json(cities);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Geo request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
