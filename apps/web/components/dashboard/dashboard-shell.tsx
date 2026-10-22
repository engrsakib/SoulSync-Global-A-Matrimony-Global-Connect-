'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderEdit,
  History,
  Inbox,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react';
import { MobileMenuSheet } from './mobile-menu-sheet';
import { toast } from 'sonner';
import { cn } from '@soulsync/ui/lib/utils';
import { logoutSession, type PublicUser } from '@/lib/auth-api';
import { notifyAuthSessionChanged } from '@/lib/auth-session';
import { fetchBiodataAccessRequests } from '@/lib/biodata-visibility-api';
import { BIODATA_ACCESS_REQUESTS_CHANGED } from '@/lib/biodata-access-request-events';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { NotificationsProvider } from '@/components/notifications/notifications-provider';
import { DashboardTopBar } from './dashboard-top-bar';
import { SidebarProfileMenu } from './sidebar-profile-menu';

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
  match?: (pathname: string) => boolean;
  pendingBadge?: boolean;
  managedNavOnly?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        href: dashboardRoutes.profile,
        label: 'My Profile',
        icon: UserCircle,
        match: (pathname) => pathname === dashboardRoutes.profile,
      },
    ],
  },
  {
    id: 'biodata',
    label: 'Biodata',
    items: [
      {
        href: dashboardRoutes.biodata,
        label: 'Biodata',
        icon: FileText,
        match: (pathname) => pathname === dashboardRoutes.biodata,
      },
      {
        href: dashboardRoutes.biodataManaged,
        label: 'Biodata I manage',
        icon: FolderEdit,
        match: (pathname) => pathname.startsWith(dashboardRoutes.biodataManaged),
        managedNavOnly: true,
      },
      {
        href: dashboardRoutes.biodataSettings,
        label: 'Biodata settings',
        icon: ShieldCheck,
        match: (pathname) => pathname.startsWith(dashboardRoutes.biodataSettings),
      },
      {
        href: dashboardRoutes.biodataPermissionRequests,
        label: 'Permission requests',
        icon: Inbox,
        match: (pathname) => pathname.startsWith(dashboardRoutes.biodataPermissionRequests),
        pendingBadge: true,
      },
    ],
  },
  {
    id: 'communities',
    label: 'Communities',
    items: [
      {
        href: dashboardRoutes.communities,
        label: 'Browse communities',
        icon: Users,
        match: (pathname) => pathname.startsWith('/communities'),
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        href: dashboardRoutes.activityLog,
        label: 'Activity log',
        icon: History,
        match: (pathname) => pathname.startsWith(dashboardRoutes.activityLog),
      },
      {
        href: dashboardRoutes.settings,
        label: 'Settings',
        icon: Settings,
        match: (pathname) => pathname.startsWith(dashboardRoutes.settings),
      },
    ],
  },
];

function formatPendingBadgeCount(count: number): string {
  if (count > 9) {
    return '9+';
  }
  return String(count);
}

type DashboardShellProps = {
  user: PublicUser;
  children: React.ReactNode;
  initialPendingAccessRequestCount?: number;
  initialPendingEditAccessCount?: number;
  showBiodataManagedNav?: boolean;
};

export function DashboardShell({
  user,
  children,
  initialPendingAccessRequestCount = 0,
  initialPendingEditAccessCount = 0,
  showBiodataManagedNav = false,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(readSidebarCollapsedPreference);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const mobileCloseRef = React.useRef<(() => void) | null>(null);
  const [livePendingAccessRequestCount, setLivePendingAccessRequestCount] = React.useState<
    number | null
  >(null);
  const pendingAccessRequestCount =
    livePendingAccessRequestCount ?? initialPendingAccessRequestCount;
  const permissionRequestsBadgeCount = pendingAccessRequestCount + initialPendingEditAccessCount;

  const refreshPendingAccessRequestCount = React.useCallback(async () => {
    try {
      const list = await fetchBiodataAccessRequests();
      setLivePendingAccessRequestCount(list.pending.length);
    } catch {
      /* ignore — badge stays stale until next navigation */
    }
  }, []);

  React.useEffect(() => {
    const onChanged = () => {
      void refreshPendingAccessRequestCount();
    };
    window.addEventListener(BIODATA_ACCESS_REQUESTS_CHANGED, onChanged);
    return () => window.removeEventListener(BIODATA_ACCESS_REQUESTS_CHANGED, onChanged);
  }, [refreshPendingAccessRequestCount]);

  const closeMobileMenu = React.useCallback(() => {
    if (mobileCloseRef.current) {
      mobileCloseRef.current();
      return;
    }
    setMobileOpen(false);
  }, []);

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

  const renderNavItem = (item: NavItem, isMobile: boolean) => {
    const Icon = item.icon;
    const active = !item.disabled && (item.match?.(pathname) ?? pathname === item.href);
    const baseClass = cn(
      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      collapsed && !isMobile && 'justify-center px-2',
      item.disabled
        ? 'cursor-not-allowed text-[var(--muted-foreground)]/60'
        : active
          ? 'bg-[var(--color-brand-700)] text-white'
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

    const showPendingBadge = item.pendingBadge && permissionRequestsBadgeCount > 0;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={baseClass}
        title={collapsed && !isMobile ? item.label : undefined}
        onClick={() => isMobile && closeMobileMenu()}
      >
        <span className="relative shrink-0">
          <Icon className="h-5 w-5" />
          {showPendingBadge && collapsed && !isMobile ? (
            <span
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[10px] font-bold text-white"
              aria-label={`${pendingAccessRequestCount} pending permission requests`}
            >
              {formatPendingBadgeCount(permissionRequestsBadgeCount)}
            </span>
          ) : null}
        </span>
        {(!collapsed || isMobile) && (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">{item.label}</span>
            {showPendingBadge ? (
              <span
                className={cn(
                  'ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                  active ? 'bg-white/20 text-white' : 'bg-amber-500 text-white',
                )}
              >
                {formatPendingBadgeCount(permissionRequestsBadgeCount)}
              </span>
            ) : null}
          </span>
        )}
      </Link>
    );
  };

  const renderNav = (isMobile: boolean) => (
    <nav className="space-y-1 p-2" aria-label="Dashboard">
      {NAV_GROUPS.map((group, groupIndex) => {
        const visibleItems = group.items.filter(
          (item) => !item.managedNavOnly || showBiodataManagedNav,
        );
        if (visibleItems.length === 0) {
          return null;
        }
        return (
          <div
            key={group.id}
            className={cn(groupIndex > 0 && 'mt-3 border-t border-[var(--border)]/60 pt-3')}
          >
            {(!collapsed || isMobile) && (
              <p
                className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
                id={`nav-group-${group.id}`}
              >
                {group.label}
              </p>
            )}
            <div
              className="space-y-0.5"
              role="group"
              aria-labelledby={!collapsed || isMobile ? `nav-group-${group.id}` : undefined}
            >
              {visibleItems.map((item) => renderNavItem(item, isMobile))}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const sidebarFooter = (isMobile: boolean) => (
    <SidebarProfileMenu
      user={user}
      collapsed={collapsed}
      isMobile={isMobile}
      onLogout={() => void onLogout()}
      onNavigate={() => isMobile && closeMobileMenu()}
    />
  );

  return (
    <NotificationsProvider>
    <div className="flex min-h-screen flex-col bg-[var(--muted)]/30">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 md:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] hover:bg-[var(--muted)]"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="text-sm font-semibold text-[var(--color-brand-700)]">
          SoulSync
        </Link>
      </header>

      <div className="flex flex-1">
        <div
          className={cn(
            'relative hidden shrink-0 overflow-visible transition-[width] duration-200 md:block',
            collapsed ? 'w-[4.5rem]' : 'w-64',
          )}
        >
          <aside className="flex h-screen max-h-screen w-full flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--background)] md:sticky md:top-0">
            <div className="flex h-14 shrink-0 items-center border-b border-[var(--border)] px-3">
              {!collapsed ? (
                <Link
                  href="/"
                  className="flex min-w-0 flex-1 items-center gap-2 truncate pr-2 text-sm font-semibold tracking-tight text-[var(--color-brand-700)]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-700)] text-xs font-bold text-white">
                    S
                  </span>
                  <span className="truncate">SoulSync Global</span>
                </Link>
              ) : (
                <Link
                  href="/"
                  className="mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-700)] text-xs font-bold text-white"
                  aria-label="SoulSync home"
                >
                  S
                </Link>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {renderNav(false)}
              </div>
              <div className="shrink-0">{sidebarFooter(false)}</div>
            </div>
          </aside>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              'absolute top-7 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full',
              'border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] shadow-sm',
              'hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
              'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none',
              '-right-4',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {mobileOpen ? (
          <MobileMenuSheet
            onClosed={() => {
              mobileCloseRef.current = null;
              setMobileOpen(false);
            }}
            onRegisterClose={(requestClose) => {
              mobileCloseRef.current = requestClose;
            }}
            header={
              <Link
                href="/"
                className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold tracking-tight text-[var(--color-brand-700)]"
                onClick={() => closeMobileMenu()}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-700)] text-xs font-bold text-white">
                  S
                </span>
                <span className="truncate">SoulSync Global</span>
              </Link>
            }
            footer={sidebarFooter(true)}
          >
            {renderNav(true)}
          </MobileMenuSheet>
        ) : null}

        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <DashboardTopBar />
            {children}
          </div>
        </main>
      </div>
    </div>
    </NotificationsProvider>
  );
}
