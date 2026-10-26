import { NextResponse } from 'next/server';
import { getAboutPageContent } from '@/lib/about-page/get-content';

export async function GET() {
  const content = await getAboutPageContent();
  return NextResponse.json(content, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
