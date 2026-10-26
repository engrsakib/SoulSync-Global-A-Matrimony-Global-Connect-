import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { MessengerLinkPreviewDto } from '@soulsync/shared-types/messenger';
import { assertSafeLinkPreviewUrl } from '@soulsync/shared-types/messenger-link-preview-guard';
import { RedisService } from '../redis/redis.service';
import { MESSENGER_OG_CACHE_TTL_SECONDS, MESSENGER_REDIS } from './messenger.constants';

const MAX_BODY_BYTES = 512_000;
const FETCH_TIMEOUT_MS = 8000;

@Injectable()
export class MessengerLinkPreviewService {
  constructor(private readonly redis: RedisService) {}

  async fetchPreview(rawUrl: string): Promise<MessengerLinkPreviewDto | null> {
    const safe = assertSafeLinkPreviewUrl(rawUrl);
    if (!safe) {
      return null;
    }
    const url = safe.toString();
    const cacheKey = MESSENGER_REDIS.ogCache(createHash('sha256').update(url).digest('hex'));
    try {
      if (this.redis.client.status === 'wait') {
        await this.redis.client.connect();
      }
      const cached = await this.redis.client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as MessengerLinkPreviewDto;
      }
    } catch {
      /* ignore cache read */
    }

    const html = await this.fetchHtml(url);
    if (!html) {
      return { url, title: null, description: null, imageUrl: null, siteName: null };
    }
    const preview: MessengerLinkPreviewDto = {
      url,
      title: metaContent(html, 'og:title') ?? metaContent(html, 'title'),
      description: metaContent(html, 'og:description') ?? metaContent(html, 'description'),
      imageUrl: metaContent(html, 'og:image'),
      siteName: metaContent(html, 'og:site_name'),
    };
    try {
      await this.redis.client.set(cacheKey, JSON.stringify(preview), 'EX', MESSENGER_OG_CACHE_TTL_SECONDS);
    } catch {
      /* ignore cache write */
    }
    return preview;
  }

  private async fetchHtml(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      let current = url;
      for (let i = 0; i < 3; i += 1) {
        const next = assertSafeLinkPreviewUrl(current);
        if (!next) {
          return null;
        }
        const response = await fetch(next.toString(), {
          signal: controller.signal,
          redirect: 'manual',
          headers: { Accept: 'text/html', 'User-Agent': 'SoulSyncMessengerPreview/1.0' },
        });
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) {
            return null;
          }
          current = new URL(location, next).toString();
          continue;
        }
        if (!response.ok) {
          return null;
        }
        const buf = Buffer.from(await response.arrayBuffer());
        if (buf.byteLength > MAX_BODY_BYTES) {
          return buf.subarray(0, MAX_BODY_BYTES).toString('utf8');
        }
        return buf.toString('utf8');
      }
      return null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

function metaContent(html: string, key: string): string | null {
  const og = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapeRegExp(key)}["'][^>]+content=["']([^"']+)["']`,
    'i',
  ).exec(html);
  if (og?.[1]) {
    return decodeHtmlEntities(og[1].trim());
  }
  const ogRev = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapeRegExp(key)}["']`,
    'i',
  ).exec(html);
  if (ogRev?.[1]) {
    return decodeHtmlEntities(ogRev[1].trim());
  }
  if (key === 'title') {
    const title = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    return title?.[1] ? decodeHtmlEntities(title[1].trim()) : null;
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
