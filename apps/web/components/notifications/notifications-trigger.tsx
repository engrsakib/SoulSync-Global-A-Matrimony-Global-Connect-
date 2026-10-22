'use client';

import { Bell } from 'lucide-react';
import { HiOutlineBell } from 'react-icons/hi2';
import { Button } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { useNotifications } from '@/components/notifications/notifications-provider';

type NotificationsTriggerProps = {
  variant: 'dashboard' | 'header';
  overHero?: boolean;
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  return (
    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

function DashboardUnreadBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  return (
    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function NotificationsTrigger({ variant, overHero }: NotificationsTriggerProps) {
  const { unreadCount, setOpen } = useNotifications();

  if (variant === 'dashboard') {
    return (
      <button
        type="button"
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-[var(--color-brand-800)] shadow-sm transition hover:bg-white"
        onClick={() => setOpen(true)}
      >
        <HiOutlineBell className="h-5 w-5" aria-hidden />
        <DashboardUnreadBadge count={unreadCount} />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Notifications"
      className={cn(
        'relative h-10 w-10',
        overHero && 'text-white hover:bg-white/10 hover:text-white',
      )}
      onClick={() => setOpen(true)}
    >
      <Bell className="h-6 w-6" strokeWidth={2} />
      <UnreadBadge count={unreadCount} />
    </Button>
  );
}
