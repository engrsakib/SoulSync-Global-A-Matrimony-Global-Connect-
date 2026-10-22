'use client';

import * as React from 'react';
import type { UserNotificationDto } from '@soulsync/shared-types/notifications';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications-client';
import { NotificationsDrawer } from '@/components/notifications/notifications-drawer';

const POLL_INTERVAL_MS = 60_000;

type NotificationsContextValue = {
  items: UserNotificationDto[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  nextCursor: string | null;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null);

export function useNotifications(): NotificationsContextValue {
  const value = React.useContext(NotificationsContext);
  if (!value) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return value;
}

type NotificationsProviderProps = {
  children: React.ReactNode;
};

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<UserNotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchNotifications();
      setItems(page.items ?? []);
      setUnreadCount(page.unreadCount ?? 0);
      setNextCursor(page.nextCursor ?? null);
    } catch {
      setItems([]);
      setUnreadCount(0);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = React.useCallback(async () => {
    if (!nextCursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const page = await fetchNotifications(nextCursor);
      setItems((prev) => [...prev, ...(page.items ?? [])]);
      setUnreadCount(page.unreadCount ?? 0);
      setNextCursor(page.nextCursor ?? null);
    } catch {
      /* keep current list */
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  const markRead = React.useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);
      setUnreadCount((count) => Math.max(0, count - 1));
      setItems((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, readAt: row.readAt ?? new Date().toISOString() } : row,
        ),
      );
    } catch {
      /* ignore */
    }
  }, []);

  const markAllRead = React.useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setItems((prev) =>
        prev.map((row) => ({ ...row, readAt: row.readAt ?? new Date().toISOString() })),
      );
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    const interval = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [refresh]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, refresh]);

  const value = React.useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      loadingMore,
      nextCursor,
      open,
      setOpen,
      refresh,
      loadMore,
      markRead,
      markAllRead,
    }),
    [
      items,
      unreadCount,
      loading,
      loadingMore,
      nextCursor,
      open,
      refresh,
      loadMore,
      markRead,
      markAllRead,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationsDrawer />
    </NotificationsContext.Provider>
  );
}
