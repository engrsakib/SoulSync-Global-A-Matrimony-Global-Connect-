'use client';

import Link from 'next/link';
import { cn } from '@soulsync/ui/lib/utils';
import type { UserNotificationDto } from '@soulsync/shared-types/notifications';
import { useNotifications } from '@/components/notifications/notifications-provider';
import { formatRelativeTime } from '@/lib/communities-format';
import { btnPrimaryOutlineMd } from '@/lib/ui-classes';

export function NotificationsList() {
  const { items, loading, loadingMore, nextCursor, markRead, setOpen, loadMore } =
    useNotifications();

  async function handleOpenItem(notification: UserNotificationDto) {
    if (!notification.readAt) {
      await markRead(notification.id);
    }
    setOpen(false);
  }

  if (loading && items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Loading…</p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
        No notifications yet
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
        {items.map((notification) => (
          <li key={notification.id} className="border-b border-[var(--border)]/40 last:border-0">
            <Link
              href={notification.linkPath}
              className={cn(
                'block px-4 py-3 hover:bg-[var(--muted)]',
                !notification.readAt && 'bg-[var(--muted)]/50',
              )}
              onClick={() => {
                void handleOpenItem(notification);
              }}
            >
              <p className="text-sm font-medium text-[var(--foreground)]">{notification.title}</p>
              {notification.body ? (
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{notification.body}</p>
              ) : null}
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {formatRelativeTime(notification.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {nextCursor ? (
        <div className="shrink-0 border-t border-[var(--border)] p-3">
          <button
            type="button"
            className={cn(btnPrimaryOutlineMd, 'w-full')}
            disabled={loadingMore}
            onClick={() => {
              void loadMore();
            }}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
