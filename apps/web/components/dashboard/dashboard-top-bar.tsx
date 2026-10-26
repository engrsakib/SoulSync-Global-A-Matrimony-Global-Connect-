'use client';

import * as React from 'react';
import Link from 'next/link';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import { cn } from '@soulsync/ui/lib/utils';
import { NotificationsTrigger } from '@/components/notifications/notifications-trigger';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { fetchConversations } from '@/lib/messenger/messenger-api';

/** Fixed locale so SSR (Node) and the browser produce the same string (avoids hydration mismatch). */
const HEADER_DATE_LOCALE = 'en-GB';

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString(HEADER_DATE_LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

type IconLinkProps = {
  label: string;
  count: number;
  href: string;
  children: React.ReactNode;
};

function IconLink({ label, count, href, children }: IconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--card)] text-[var(--color-brand-800)] shadow-sm transition hover:bg-[var(--muted)]"
    >
      {children}
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  );
}

export function DashboardTopBar() {
  const [dateLabel] = React.useState(() => formatHeaderDate(new Date()));
  const [unreadMessages, setUnreadMessages] = React.useState(0);

  React.useEffect(() => {
    void fetchConversations()
      .then((list) => setUnreadMessages(list.totalUnread))
      .catch(() => {
        /* badge stays 0 */
      });
  }, []);

  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 rounded-2xl px-4 py-4 sm:px-6 sm:py-5',
        'bg-[var(--dashboard-header)] text-white',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block min-w-0 flex-1 lg:max-w-xl">
          <span className="sr-only">Search</span>
          <input
            type="search"
            placeholder="Search"
            disabled
            className="h-11 w-full rounded-full border-0 bg-[var(--card)] pr-4 pl-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-80"
          />
        </label>
        <p
          className="text-center text-sm font-medium text-white/90 lg:text-right"
          suppressHydrationWarning
        >
          {dateLabel}
        </p>
        <div className="flex items-center justify-center gap-2 lg:justify-end">
          <IconLink label="Messages" count={unreadMessages} href={dashboardRoutes.messenger}>
            <HiOutlineChatBubbleLeftRight className="h-5 w-5" aria-hidden />
          </IconLink>
          <NotificationsTrigger variant="dashboard" />
        </div>
      </div>
    </div>
  );
}
