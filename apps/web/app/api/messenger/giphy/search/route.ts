import { NextResponse } from 'next/server';

type GiphyGif = {
  id: string;
  title: string;
  images: {
    fixed_height_small: { url: string };
    downsized_medium?: { url: string };
    original?: { url: string };
  };
};

export async function GET(request: Request) {
  const key = process.env.GIPHY_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ message: 'Giphy is not configured' }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (!q) {
    return NextResponse.json({ data: { items: [] } });
  }
  const url = new URL('https://api.giphy.com/v1/gifs/search');
  url.searchParams.set('api_key', key);
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '12');
  url.searchParams.set('rating', 'g');
  const response = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!response.ok) {
    return NextResponse.json({ message: 'Giphy search failed' }, { status: 502 });
  }
  const json = (await response.json()) as { data?: GiphyGif[] };
  const items = (json.data ?? []).map((gif) => ({
    id: gif.id,
    title: gif.title || 'GIF',
    previewUrl: gif.images.fixed_height_small.url,
    url: gif.images.downsized_medium?.url ?? gif.images.original?.url ?? gif.images.fixed_height_small.url,
  }));
  return NextResponse.json({ data: { items } });
}
