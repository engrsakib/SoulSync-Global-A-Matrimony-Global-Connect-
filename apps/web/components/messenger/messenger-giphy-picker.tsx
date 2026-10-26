'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { formControlClass } from '@/lib/ui-classes';
import {
  fetchMessengerGiphyTrending,
  searchMessengerGiphy,
} from '@/lib/messenger/messenger-api';
import {
  loadRecentMessengerGifs,
  MESSENGER_GIPHY_RECENT_MAX,
  rememberRecentMessengerGif,
} from '@/lib/messenger/messenger-giphy-recent';
import type { MessengerGiphyImageDto } from '@soulsync/shared-types/messenger';

type Props = {
  onClose: () => void;
  onPick: (gifUrl: string) => void;
};

const GRID_CLASS =
  'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 lg:min-h-[min(28rem,calc(100vw-4rem))]';

function capGifs(items: MessengerGiphyImageDto[]): MessengerGiphyImageDto[] {
  return items.slice(0, MESSENGER_GIPHY_RECENT_MAX);
}

function GifGrid({
  items,
  onSelect,
}: {
  items: MessengerGiphyImageDto[];
  onSelect: (gif: MessengerGiphyImageDto) => void;
}) {
  const capped = capGifs(items);
  if (capped.length === 0) {
    return null;
  }
  return (
    <div className={GRID_CLASS}>
      {capped.map((gif) => (
        <button
          key={gif.id}
          type="button"
          className="aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--color-brand-600)]"
          onClick={() => onSelect(gif)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gif.previewUrl} alt={gif.title} className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}

export function MessengerGiphyPicker({ onClose, onPick }: Props) {
  const [query, setQuery] = React.useState('');
  const recentItems = React.useMemo(() => capGifs(loadRecentMessengerGifs()), []);
  const browseLabel: 'lastUsed' | 'trending' = recentItems.length > 0 ? 'lastUsed' : 'trending';
  const [browseItems, setBrowseItems] = React.useState<MessengerGiphyImageDto[]>(recentItems);
  const [searchItems, setSearchItems] = React.useState<MessengerGiphyImageDto[]>([]);
  const [loading, setLoading] = React.useState(recentItems.length === 0);
  const [error, setError] = React.useState<string | null>(null);

  const trimmedQuery = query.trim();
  const searchReady = trimmedQuery.length >= 2;
  const showingBrowse = !searchReady;

  React.useEffect(() => {
    if (searchReady || recentItems.length > 0) {
      return;
    }
    let cancelled = false;
    void fetchMessengerGiphyTrending()
      .then((result) => {
        if (!cancelled) {
          setError(null);
          setBrowseItems(capGifs(result.items));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load GIFs');
          setBrowseItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [searchReady, recentItems.length]);

  React.useEffect(() => {
    if (!searchReady) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void searchMessengerGiphy(trimmedQuery)
        .then((result) => {
          if (!cancelled) {
            setSearchItems(capGifs(result.items));
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Search failed');
            setSearchItems([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchReady, trimmedQuery]);

  function handleSelect(gif: MessengerGiphyImageDto) {
    rememberRecentMessengerGif(gif);
    onPick(gif.url);
    onClose();
  }

  const displayItems = showingBrowse ? browseItems : searchItems;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-labelledby="messenger-giphy-title"
        className="flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl lg:max-w-2xl"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] p-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            id="messenger-giphy-title"
            type="search"
            placeholder="Search GIFs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(formControlClass, 'h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0')}
            autoFocus
          />
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-[var(--muted)]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto p-3',
            showingBrowse && 'lg:min-h-[28rem]',
          )}
        >
          {showingBrowse ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {browseLabel === 'lastUsed' ? 'Last used' : 'Trending'}
            </p>
          ) : null}
          {error ? <p className="mb-2 text-center text-sm text-red-400">{error}</p> : null}
          {loading ? <p className="text-center text-sm text-slate-400">Loading GIFs…</p> : null}
          {!loading && searchReady && displayItems.length === 0 && !error ? (
            <p className="mb-2 text-center text-sm text-slate-400">No GIFs found.</p>
          ) : null}
          {!loading ? <GifGrid items={displayItems} onSelect={handleSelect} /> : null}
        </div>
        <p className="border-t border-[var(--border)] px-3 py-2 text-[10px] text-slate-400">Powered by GIPHY</p>
      </div>
    </div>
  );
}
