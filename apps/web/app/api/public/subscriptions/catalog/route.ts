import { NextResponse } from 'next/server';
import { getSubscriptionCatalog } from '@/lib/subscription/get-catalog';

export async function GET() {
  const catalog = await getSubscriptionCatalog();
  return NextResponse.json(catalog, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
