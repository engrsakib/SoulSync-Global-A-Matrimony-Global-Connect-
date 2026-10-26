import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MessengerGiphySearchResultDto } from '@soulsync/shared-types/messenger';
import type { Env } from '../config/env.schema';

type GiphyGif = {
  id: string;
  title: string;
  images: {
    fixed_height_small: { url: string };
    downsized_medium?: { url: string };
    original?: { url: string };
  };
};

const GIPHY_PAGE_LIMIT = 12;

@Injectable()
export class MessengerGiphyService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async trending(): Promise<MessengerGiphySearchResultDto> {
    return this.fetchGifs('https://api.giphy.com/v1/gifs/trending', {});
  }

  async search(query: string): Promise<MessengerGiphySearchResultDto> {
    const q = query.trim();
    if (!q) {
      return { items: [] };
    }
    return this.fetchGifs('https://api.giphy.com/v1/gifs/search', { q });
  }

  private async fetchGifs(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<MessengerGiphySearchResultDto> {
    const key = this.config.get('GIPHY_API_KEY', { infer: true })?.trim();
    if (!key) {
      throw new ServiceUnavailableException('Giphy is not configured');
    }
    const url = new URL(endpoint);
    url.searchParams.set('api_key', key);
    url.searchParams.set('limit', String(GIPHY_PAGE_LIMIT));
    url.searchParams.set('rating', 'g');
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, value);
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new ServiceUnavailableException('Giphy request failed');
    }
    const json = (await response.json()) as { data?: GiphyGif[] };
    const items = (json.data ?? []).slice(0, GIPHY_PAGE_LIMIT).map((gif) => ({
      id: gif.id,
      title: gif.title || 'GIF',
      previewUrl: gif.images.fixed_height_small.url,
      url:
        gif.images.downsized_medium?.url ??
        gif.images.original?.url ??
        gif.images.fixed_height_small.url,
    }));
    return { items };
  }
}
