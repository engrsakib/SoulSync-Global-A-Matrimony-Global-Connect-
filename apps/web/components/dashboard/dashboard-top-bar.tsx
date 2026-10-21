'use client';

import * as React from 'react';
import { HiOutlineBell, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import { cn } from '@soulsync/ui/lib/utils';

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

type IconButtonProps = {
  label: string;
  count: number;
  children: React.ReactNode;
};

function IconButton({ label, count, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-[var(--color-brand-800)] shadow-sm transition hover:bg-white"
    >
      {children}
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  );
}

export function DashboardTopBar() {
  const [dateLabel] = React.useState(() => formatHeaderDate(new Date()));

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
            className="h-11 w-full rounded-full border-0 bg-white/95 pr-4 pl-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-80"
          />
        </label>
        <p className="text-center text-sm font-medium text-white/90 lg:text-right">{dateLabel}</p>
        <div className="flex items-center justify-center gap-2 lg:justify-end">
          <IconButton label="Messages" count={0}>
            <HiOutlineChatBubbleLeftRight className="h-5 w-5" aria-hidden />
          </IconButton>
          <IconButton label="Notifications" count={0}>
            <HiOutlineBell className="h-5 w-5" aria-hidden />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
