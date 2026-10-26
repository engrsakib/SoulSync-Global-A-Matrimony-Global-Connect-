'use client';

import * as React from 'react';
import { parseYouTubeVideoId, youTubeEmbedSrc } from '@soulsync/shared-types/messenger-youtube';
import type { MessengerLinkPreviewDto } from '@soulsync/shared-types/messenger';
import { fetchLinkPreview } from '@/lib/messenger/messenger-api';
import { cn } from '@soulsync/ui/lib/utils';

const URL_REGEX = /https?:\/\/[^\s]+/gi;

export function MessageRichContent({ text }: { text: string }) {
  const urls = text.match(URL_REGEX) ?? [];
  const firstUrl = urls[0]?.replace(/[),.]+$/, '') ?? null;
  const youTubeId = firstUrl ? parseYouTubeVideoId(firstUrl) : null;
  const previewUrl = firstUrl && !youTubeId ? firstUrl : null;
  const [preview, setPreview] = React.useState<MessengerLinkPreviewDto | null>(null);

  React.useEffect(() => {
    if (!previewUrl) {
      return;
    }
    let cancelled = false;
    void fetchLinkPreview(previewUrl).then((result) => {
      if (!cancelled) {
        setPreview(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [previewUrl]);

  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap break-words text-sm text-[var(--foreground)]">{text}</p>
      {youTubeId ? (
        <div className="aspect-video w-full max-w-md overflow-hidden rounded-xl border border-[var(--border)] bg-black">
          <iframe
            title="YouTube video"
            src={youTubeEmbedSrc(youTubeId)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
      {previewUrl && preview?.title ? (
        <a
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'block max-w-md overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]',
            'transition hover:border-[var(--color-brand-600)]',
          )}
        >
          {preview.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.imageUrl} alt="" className="h-32 w-full object-cover" />
          ) : null}
          <div className="space-y-1 p-3">
            {preview.siteName ? (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {preview.siteName}
              </p>
            ) : null}
            <p className="text-sm font-medium text-[var(--foreground)]">{preview.title}</p>
            {preview.description ? (
              <p className="line-clamp-2 text-xs text-slate-400">{preview.description}</p>
            ) : null}
          </div>
        </a>
      ) : null}
    </div>
  );
}
