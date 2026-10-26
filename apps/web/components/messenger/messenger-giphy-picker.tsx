'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { formControlClass } from '@/lib/ui-classes';
import { searchMessengerGiphy } from '@/lib/messenger/messenger-api';
import type { MessengerGiphyImageDto } from '@soulsync/shared-types/messenger';

type Props = {
  onClose: () => void;
  onPick: (gifUrl: string) => void;
};

export function MessengerGiphyPicker({ onClose, onPick }: Props) {
  const [query, setQuery] = React.useState('');
  const [items, setItems] = React.useState<MessengerGiphyImageDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const trimmedQuery = query.trim();
  const searchReady = trimmedQuery.length >= 2;

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
            setItems(result.items);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Search failed');
            setItems([]);
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
        className="flex max-h-[min(85vh,32rem)] w-full max-w-lg flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
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
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
          {loading ? <p className="text-center text-sm text-slate-400">Searching…</p> : null}
          {!loading && !searchReady ? (
            <p className="text-center text-sm text-slate-400">Type at least 2 characters.</p>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((gif) => (
              <button
                key={gif.id}
                type="button"
                className="aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)] hover:border-[var(--color-brand-600)]"
                onClick={() => {
                  onPick(gif.url);
                  onClose();
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gif.previewUrl} alt={gif.title} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <p className="border-t border-[var(--border)] px-3 py-2 text-[10px] text-slate-400">Powered by GIPHY</p>
      </div>
    </div>
  );
}
