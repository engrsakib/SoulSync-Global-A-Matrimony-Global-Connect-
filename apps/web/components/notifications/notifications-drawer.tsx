'use client';

import { X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@soulsync/ui/drawer';
import { useNotifications } from '@/components/notifications/notifications-provider';
import { NotificationsList } from '@/components/notifications/notifications-list';

export function NotificationsDrawer() {
  const { open, setOpen, unreadCount, markAllRead } = useNotifications();

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerContent className="flex h-[100dvh] max-h-[100dvh] flex-col">
        <DrawerHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <DrawerTitle>Notifications</DrawerTitle>
            <DrawerDescription className="sr-only">
              Your recent activity and alerts
            </DrawerDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-[var(--primary)] hover:underline"
                onClick={() => {
                  void markAllRead();
                }}
              >
                Mark all read
              </button>
            ) : null}
            <DrawerClose asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] hover:bg-[var(--muted)]"
                aria-label="Close notifications"
              >
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <NotificationsList />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
