'use client';

import Link from 'next/link';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@soulsync/ui/avatar';
import type {
  ActivityLogListQueryDto,
  ActivityLogListSortDto,
  UserActivityLogDto,
  UserActivityLogListDto,
} from '@soulsync/shared-types/activity-log';
import { USER_ACTIVITY_TYPES } from '@soulsync/shared-types/activity-log';
import { effectiveCheckInTimeZone } from '@soulsync/shared-types/check-in';
import { toast } from 'sonner';
import { formatCommunityPostTimestamp } from '@/lib/communities-format';
import { fetchActivityLog } from '@/lib/activity-log-client';
import { btnPrimaryOutline, dashboardPageTitle } from '@/lib/ui-classes';
import { DashboardCard } from './dashboard-card';

type ActivityLogFeedProps = {
  initialData: UserActivityLogListDto;
};

const FILTER_TYPE_OPTIONS = USER_ACTIVITY_TYPES.filter((t) =>
  [
    'PROFILE_UPDATED',
    'BIODATA_UPDATED',
    'BIODATA_PRIVACY_UPDATED',
    'COMMUNITY_COMMENT_CREATED',
    'COMMUNITY_REACTION_ADDED',
    'COMMUNITY_JOINED',
    'ACCOUNT_REGISTERED',
    'SESSION_LOGOUT',
    'BIODATA_VIEWED',
  ].includes(t),
);

function actorInitials(displayName: string | null, username: string | null): string {
  const label = displayName?.trim() || username?.replace(/^@+/, '') || '?';
  return label.slice(0, 2).toUpperCase();
}

function dateGroupLabel(iso: string, timeZone: string): string {
  const date = new Date(iso);
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = fmt(now);
  const day = fmt(date);
  if (day === today) {
    return 'Today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === fmt(yesterday)) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function groupItemsByDate(
  items: UserActivityLogDto[],
  timeZone: string,
): Array<{ label: string; items: UserActivityLogDto[] }> {
  const groups: Array<{ label: string; items: UserActivityLogDto[] }> = [];
  for (const item of items) {
    const label = dateGroupLabel(item.occurredAt, timeZone);
    const last = groups[groups.length - 1];
    if (last?.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }
  return groups;
}

export function ActivityLogFeed({ initialData }: ActivityLogFeedProps) {
  const [data, setData] = React.useState(initialData);
  const [filters, setFilters] = React.useState<ActivityLogListQueryDto>({ sort: 'newest' });
  const [searchInput, setSearchInput] = React.useState('');
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [loadingFilters, setLoadingFilters] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestGen = React.useRef(0);
  const skipFilterFetch = React.useRef(true);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const timeZone = effectiveCheckInTimeZone(data.viewerTimeZone);

  const activeQuery = React.useMemo(
    (): ActivityLogListQueryDto => ({
      ...filters,
      q: searchInput.trim() || undefined,
    }),
    [filters, searchInput],
  );

  React.useEffect(() => {
    if (skipFilterFetch.current) {
      skipFilterFetch.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      const gen = ++requestGen.current;
      setLoadingFilters(true);
      setError(null);
      void fetchActivityLog(activeQuery)
        .then((next) => {
          if (gen !== requestGen.current) {
            return;
          }
          setData(next);
        })
        .catch((err) => {
          if (gen !== requestGen.current) {
            return;
          }
          setError(err instanceof Error ? err.message : 'Could not load activity');
        })
        .finally(() => {
          if (gen === requestGen.current) {
            setLoadingFilters(false);
          }
        });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [activeQuery]);

  const loadMore = React.useCallback(async () => {
    if (!data.nextCursor || loadingMore || loadingFilters) {
      return;
    }
    setLoadingMore(true);
    const gen = requestGen.current;
    try {
      const next = await fetchActivityLog(activeQuery, data.nextCursor);
      if (gen !== requestGen.current) {
        return;
      }
      setData((prev) => ({
        ...next,
        items: [...prev.items, ...next.items],
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load more');
    } finally {
      setLoadingMore(false);
    }
  }, [activeQuery, data.nextCursor, loadingFilters, loadingMore]);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !data.nextCursor) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [data.nextCursor, loadMore]);

  const grouped = groupItemsByDate(data.items, timeZone);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={dashboardPageTitle}>Activity log</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Your recent actions and updates across SoulSync. Times shown in {timeZone}.
        </p>
      </div>

      <DashboardCard title="Filters">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)] min-w-[12rem] flex-1">
            Search
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search activity…"
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
            Sort
            <select
              value={filters.sort ?? 'newest'}
              onChange={(e) =>
                setFilters((f) => ({ ...f, sort: e.target.value as ActivityLogListSortDto }))
              }
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
            From
            <input
              type="date"
              value={filters.dateFrom?.slice(0, 10) ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  dateFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
                }))
              }
              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
            To
            <input
              type="date"
              value={filters.dateTo?.slice(0, 10) ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  dateTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
                }))
              }
              className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTER_TYPE_OPTIONS.map((type) => {
            const selected = filters.types?.includes(type) ?? false;
            return (
              <button
                key={type}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs ${
                  selected
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]'
                    : 'border-[var(--border)] text-[var(--muted-foreground)]'
                }`}
                onClick={() =>
                  setFilters((f) => {
                    const current = f.types ?? [];
                    const next = selected
                      ? current.filter((t) => t !== type)
                      : [...current, type];
                    return { ...f, types: next.length ? next : undefined };
                  })
                }
              >
                {type.replaceAll('_', ' ').toLowerCase()}
              </button>
            );
          })}
        </div>
      </DashboardCard>

      <DashboardCard title="Timeline">
        {loadingFilters && data.items.length === 0 ? (
          <ul className="space-y-3 animate-pulse">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-16 rounded-lg bg-[var(--muted)]/50" />
            ))}
          </ul>
        ) : error ? (
          <div className="text-sm text-[var(--destructive)]">
            <p>{error}</p>
            <button
              type="button"
              className={`${btnPrimaryOutline} mt-3`}
              onClick={() => setFilters((f) => ({ ...f }))}
            >
              Retry
            </button>
          </div>
        ) : data.items.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No activity matches your filters yet.
          </p>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.label}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {group.label}
                </h3>
                <ul className="divide-y divide-[var(--border)]/60">
                  {group.items.map((entry) => {
                    const { relative, absolute } = formatCommunityPostTimestamp(
                      entry.occurredAt,
                      data.viewerTimeZone,
                    );
                    const actor = entry.actor;
                    return (
                      <li key={entry.id}>
                        <Link
                          href={entry.linkPath}
                          className="flex gap-3 py-4 transition-colors hover:bg-[var(--muted)]/40 -mx-2 px-2 rounded-lg"
                        >
                          <Avatar className="size-10 shrink-0">
                            {actor?.avatarUrl ? (
                              <AvatarImage src={actor.avatarUrl} alt="" />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {actorInitials(actor?.displayName ?? null, actor?.username ?? null)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              {entry.title}
                            </p>
                            {entry.body ? (
                              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                                {entry.body}
                              </p>
                            ) : null}
                            <p
                              className="mt-1 text-xs text-[var(--muted-foreground)]"
                              title={absolute}
                            >
                              {relative}
                              {absolute ? ` · ${absolute}` : null}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {data.nextCursor ? (
          <div className="mt-4 border-t border-[var(--border)]/60 pt-4 space-y-3">
            <div ref={sentinelRef} className="h-1" aria-hidden />
            <button
              type="button"
              className={`${btnPrimaryOutline} w-full sm:w-auto`}
              disabled={loadingMore || loadingFilters}
              onClick={() => {
                void loadMore();
              }}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        ) : null}
      </DashboardCard>
    </div>
  );
}
