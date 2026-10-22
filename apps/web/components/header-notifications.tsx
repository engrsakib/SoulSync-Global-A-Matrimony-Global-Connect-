'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { Button } from '@soulsync/ui/button';
import type { UserNotificationDto } from '@soulsync/shared-types/notifications';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications-client';
import { formatRelativeTime } from '@/lib/communities-format';

type HeaderNotificationsProps = {
  overHero?: boolean;
};

export function HeaderNotifications({ overHero }: HeaderNotificationsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<UserNotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchNotifications();
      setItems(page.items ?? []);
      setUnreadCount(page.unreadCount ?? 0);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    const interval = window.setInterval(() => {
      void load();
    }, 60_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [load]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, load]);

  async function handleOpenItem(notification: UserNotificationDto) {
    if (!notification.readAt) {
      try {
        await markNotificationRead(notification.id);
        setUnreadCount((count) => Math.max(0, count - 1));
        setItems((prev) =>
          prev.map((row) =>
            row.id === notification.id ? { ...row, readAt: new Date().toISOString() } : row,
          ),
        );
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setItems((prev) =>
        prev.map((row) => ({ ...row, readAt: row.readAt ?? new Date().toISOString() })),
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Notifications"
        className={cn(
          'relative h-9 w-9',
          overHero && 'text-white hover:bg-white/10 hover:text-white',
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-[var(--primary)] hover:underline"
                onClick={() => {
                  void handleMarkAllRead();
                }}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-auto py-1">
            {loading && items.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                Loading…
              </li>
            ) : items.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                No notifications yet
              </li>
            ) : (
              items.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notification.linkPath}
                    className={cn(
                      'block px-3 py-2 hover:bg-[var(--muted)]',
                      !notification.readAt && 'bg-[var(--muted)]/50',
                    )}
                    onClick={() => {
                      void handleOpenItem(notification);
                    }}
                  >
                    <p className="text-sm font-medium">{notification.title}</p>
                    {notification.body ? (
                      <p className="text-xs text-[var(--muted-foreground)]">{notification.body}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
