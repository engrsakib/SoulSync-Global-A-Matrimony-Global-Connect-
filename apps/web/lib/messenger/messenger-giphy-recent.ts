import type { MessengerGiphyImageDto } from '@soulsync/shared-types/messenger';

const STORAGE_KEY = 'messenger-giphy-recent-v1';
/** 4 columns × 3 rows on large screens */
export const MESSENGER_GIPHY_RECENT_MAX = 12;

type StoredRecentGif = MessengerGiphyImageDto;

function readRaw(): StoredRecentGif[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (row): row is StoredRecentGif =>
          row !== null &&
          typeof row === 'object' &&
          typeof (row as StoredRecentGif).id === 'string' &&
          typeof (row as StoredRecentGif).url === 'string' &&
          typeof (row as StoredRecentGif).previewUrl === 'string',
      )
      .slice(0, MESSENGER_GIPHY_RECENT_MAX);
  } catch {
    return [];
  }
}

export function loadRecentMessengerGifs(): MessengerGiphyImageDto[] {
  return readRaw();
}

export function rememberRecentMessengerGif(gif: MessengerGiphyImageDto): void {
  const normalized: StoredRecentGif = {
    id: gif.id,
    url: gif.url,
    previewUrl: gif.previewUrl || gif.url,
    title: gif.title?.trim() || 'GIF',
  };
  const withoutDup = readRaw().filter((row) => row.id !== normalized.id && row.url !== normalized.url);
  const next = [normalized, ...withoutDup].slice(0, MESSENGER_GIPHY_RECENT_MAX);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/** Stable id when inserting a GIF URL without Giphy metadata. */
export function messengerGifIdFromUrl(url: string): string {
  const trimmed = url.trim();
  const fromPath = /giphy\.com\/media\/([^/]+)/i.exec(trimmed)?.[1];
  if (fromPath) {
    return fromPath;
  }
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  }
  return `url-${Math.abs(hash)}`;
}
