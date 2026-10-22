'use client';

import Link from 'next/link';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@soulsync/ui/avatar';
import type { UserActivityLogListDto } from '@soulsync/shared-types/activity-log';
import { effectiveCheckInTimeZone } from '@soulsync/shared-types/check-in';
import { toast } from 'sonner';
import { formatCommunityPostTimestamp } from '@/lib/communities-format';
import { fetchActivityLog } from '@/lib/activity-log-client';
import { btnPrimaryOutline, dashboardPageTitle } from '@/lib/ui-classes';
import { DashboardCard } from './dashboard-card';

type ActivityLogFeedProps = {
  initialData: UserActivityLogListDto;
};

function actorInitials(displayName: string | null, username: string | null): string {
  const label = displayName?.trim() || username?.replace(/^@+/, '') || '?';
  return label.slice(0, 2).toUpperCase();
}

export function ActivityLogFeed({ initialData }: ActivityLogFeedProps) {
  const [data, setData] = React.useState(initialData);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const timeZone = effectiveCheckInTimeZone(data.viewerTimeZone);
  const timeZoneLabel = timeZone;

  const loadMore = async () => {
    if (!data.nextCursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const next = await fetchActivityLog(data.nextCursor);
      setData((prev) => ({
        ...next,
        items: [...prev.items, ...next.items],
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load more');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={dashboardPageTitle}>Activity log</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Your recent actions and updates across SoulSync. Times shown in {timeZoneLabel}.
        </p>
      </div>

      <DashboardCard title="Timeline">
        {data.items.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No activity yet. Updates to your profile, biodata, permissions, and communities will
            appear here.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60">
            {data.items.map((entry) => {
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
                      <p className="text-sm font-medium text-[var(--foreground)]">{entry.title}</p>
                      {entry.body ? (
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{entry.body}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]" title={absolute}>
                        {relative}
                        {absolute ? ` · ${absolute}` : null}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {data.nextCursor ? (
          <div className="mt-4 border-t border-[var(--border)]/60 pt-4">
            <button
              type="button"
              className={`${btnPrimaryOutline} w-full sm:w-auto`}
              disabled={loadingMore}
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
