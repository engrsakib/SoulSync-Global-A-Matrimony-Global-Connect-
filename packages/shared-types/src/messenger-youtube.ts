const YOUTUBE_ID = /^[\w-]{11}$/;

/** Extract YouTube video id from common URL shapes; null if invalid. */
export function parseYouTubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0] ?? '';
    return YOUTUBE_ID.test(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v') ?? '';
      return YOUTUBE_ID.test(id) ? id : null;
    }
    const embedMatch = /^\/embed\/([\w-]{11})/.exec(url.pathname);
    if (embedMatch?.[1] && YOUTUBE_ID.test(embedMatch[1])) {
      return embedMatch[1];
    }
    const shortsMatch = /^\/shorts\/([\w-]{11})/.exec(url.pathname);
    if (shortsMatch?.[1] && YOUTUBE_ID.test(shortsMatch[1])) {
      return shortsMatch[1];
    }
  }
  return null;
}

export function youTubeEmbedSrc(videoId: string): string {
  if (!YOUTUBE_ID.test(videoId)) {
    throw new Error('Invalid YouTube video id');
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
