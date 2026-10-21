import { NextResponse } from 'next/server';
import type { GeoCountrySummary } from '@soulsync/shared-types/geo';
import { proxyGeoGet } from '@/lib/geo-proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = searchParams.get('limit');
  const params = new URLSearchParams();
  if (q) {
    params.set('q', q);
  }
  if (limit) {
    params.set('limit', limit);
  }
  const query = params.toString();
  try {
    const countries = await proxyGeoGet<GeoCountrySummary[]>(
      `/geo/countries${query ? `?${query}` : ''}`,
    );
    return NextResponse.json(countries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Geo request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
