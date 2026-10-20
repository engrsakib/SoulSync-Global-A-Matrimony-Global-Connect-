'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { cn } from '@soulsync/ui/lib/utils';
import { logoutSession, type PublicUser } from '@/lib/auth-api';
import { notifyAuthSessionChanged } from '@/lib/auth-session';
import { userDisplayLabel, userInitials, userSecondaryLine } from '@/lib/user-display';

const SIDEBAR_STORAGE_KEY = 'ss_sidebar_collapsed';

function readSidebarCollapsedPreference(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: LayoutDashboard },
  { href: '#', label: 'Biodata', icon: FileText, disabled: true },
  { href: '#', label: 'Settings', icon: Settings, disabled: true },
];

type DashboardShellProps = {
  user: PublicUser;
  children: React.ReactNode;
};

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(readSidebarCollapsedPreference);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const onLogout = async () => {
    try {
      await logoutSession();
      notifyAuthSessionChanged();
      toast.success('Signed out');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Could not sign out');
    }
  };

  const sidebarContent = (isMobile: boolean) => (
    <>
      <div
        className={cn(
          'border-b border-[var(--border)] p-4',
          collapsed && !isMobile && 'flex flex-col items-center px-2',
        )}
      >
        <Avatar
          className={cn(
            'bg-gradient-to-br from-[var(--color-brand-600)] to-blue-600 shadow-md ring-2 ring-[var(--background)]',
            collapsed && !isMobile ? 'h-10 w-10' : 'h-12 w-12',
          )}
        >
          <AvatarFallback className="bg-transparent text-sm font-semibold text-white">
            {userInitials(user)}
          </AvatarFallback>
        </Avatar>
        {(!collapsed || isMobile) && (
          <div className="mt-3 min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {userDisplayLabel(user)}
            </p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
              {userSecondaryLine(user)}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2" aria-label="Dashboard">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = !item.disabled && pathname === item.href;
          const baseClass = cn(
            'flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors',
            collapsed && !isMobile && 'justify-center px-2',
            item.disabled
              ? 'cursor-not-allowed text-[var(--muted-foreground)]/60'
              : active
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
          );

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className={baseClass}
                title={collapsed && !isMobile ? `${item.label} (coming soon)` : undefined}
                aria-disabled
              >
                <Icon className="h-5 w-5 shrink-0" />
                {(!collapsed || isMobile) && <span className="flex-1 text-left">{item.label}</span>}
                {(!collapsed || isMobile) && (
                  <span className="text-[10px] tracking-wide text-[var(--muted-foreground)] uppercase">
                    Soon
                  </span>
                )}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={baseClass}
              title={collapsed && !isMobile ? item.label : undefined}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-2">
        <button
          type="button"
          onClick={() => void onLogout()}
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]',
            collapsed && !isMobile && 'justify-center px-2',
          )}
          title={collapsed && !isMobile ? 'Log out' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(!collapsed || isMobile) && <span>Log out</span>}
        </button>
        {!isMobile && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              'mt-1 flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
              collapsed && 'justify-center px-2',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--muted)]/20">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 md:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] hover:bg-[var(--muted)]"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="text-sm font-semibold text-[var(--foreground)]">
          SoulSync
        </Link>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            'hidden shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background)] transition-[width] duration-200 md:flex',
            collapsed ? 'w-16' : 'w-64',
          )}
        >
          <div className="flex h-14 items-center border-b border-[var(--border)] px-4">
            {!collapsed ? (
              <Link
                href="/"
                className="text-sm font-semibold tracking-tight text-[var(--foreground)]"
              >
                SoulSync Global
              </Link>
            ) : (
              <Link
                href="/"
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]"
                aria-label="SoulSync home"
              >
                S
              </Link>
            )}
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{sidebarContent(false)}</div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-[min(100%,18rem)] flex-col bg-[var(--background)] shadow-xl">
              <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
                <span className="text-sm font-semibold">Menu</span>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] hover:bg-[var(--muted)]"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">{sidebarContent(true)}</div>
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
