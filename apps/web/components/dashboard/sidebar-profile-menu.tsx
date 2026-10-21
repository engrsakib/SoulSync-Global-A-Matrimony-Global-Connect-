'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@soulsync/ui/lib/utils';
import type { PublicUser } from '@/lib/auth-api';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { userDisplayLabel, userSecondaryLine } from '@/lib/user-display';
import { ProfileAvatar } from './profile-avatar';

type SidebarProfileMenuProps = {
  user: PublicUser;
  collapsed: boolean;
  isMobile: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
};

export function SidebarProfileMenu({
  user,
  collapsed,
  isMobile,
  onLogout,
  onNavigate,
}: SidebarProfileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const onDocClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const showText = !collapsed || isMobile;
  const menuItemClass = (href: string) => {
    const active =
      href === dashboardRoutes.profile
        ? pathname === dashboardRoutes.profile
        : pathname.startsWith(href);
    return cn(
      'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-[var(--color-brand-700)] text-white'
        : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
    );
  };

  return (
    <div ref={rootRef} className="relative border-t border-[var(--border)] p-2">
      {open && showText ? (
        <div
          className="absolute right-2 bottom-full left-2 mb-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-2 shadow-lg"
          role="menu"
        >
          <Link
            href={dashboardRoutes.profile}
            role="menuitem"
            className={menuItemClass(dashboardRoutes.profile)}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            My Profile
          </Link>
          <Link
            href={dashboardRoutes.settings}
            role="menuitem"
            className={menuItemClass(dashboardRoutes.settings)}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            Profile settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors',
          open && showText ? 'bg-[var(--color-brand-700)] text-white' : 'hover:bg-[var(--muted)]',
          collapsed && !isMobile && 'justify-center',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <ProfileAvatar user={user} size={collapsed && !isMobile ? 'sm' : 'md'} />
        {showText ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{userDisplayLabel(user)}</span>
            <span
              className={cn(
                'block truncate text-xs',
                open ? 'text-white/80' : 'text-[var(--muted-foreground)]',
              )}
            >
              {userSecondaryLine(user)}
            </span>
          </span>
        ) : null}
      </button>
    </div>
  );
}
