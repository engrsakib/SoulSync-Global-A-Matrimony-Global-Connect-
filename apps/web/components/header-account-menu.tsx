'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@soulsync/ui/lib/utils';
import { ProfileAvatar } from '@/components/dashboard/profile-avatar';
import { logoutSession, type PublicUser } from '@/lib/auth-api';
import { notifyAuthSessionChanged } from '@/lib/auth-session';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { userDisplayLabel, userSecondaryLine } from '@/lib/user-display';

type HeaderAccountMenuProps = {
  user: PublicUser;
  overHero?: boolean;
  className?: string;
  onNavigate?: () => void;
};

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
};

function MenuItem({ icon, label, onClick, variant = 'default' }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)]',
        variant === 'danger'
          ? 'text-[var(--destructive)] hover:bg-[var(--destructive)]/10'
          : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          variant === 'danger'
            ? 'bg-[var(--destructive)]/10 text-[var(--destructive)]'
            : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export function HeaderAccountMenu({
  user,
  overHero = false,
  className,
  onNavigate,
}: HeaderAccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
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
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const avatarRing = overHero ? 'ring-white/40' : 'ring-white dark:ring-[var(--background)]';
  const displayName = userDisplayLabel(user);
  const secondary = userSecondaryLine(user);

  const navigate = (path: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(path);
  };

  const onLogout = async () => {
    setOpen(false);
    onNavigate?.();
    try {
      await logoutSession();
      notifyAuthSessionChanged();
      toast.success('Signed out');
      router.refresh();
    } catch {
      toast.error('Could not sign out');
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'flex items-center gap-1 rounded-full p-0.5 transition-colors',
          'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none',
          open ? 'bg-[var(--muted)]/80' : 'hover:bg-[var(--muted)]/50',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
      >
        <ProfileAvatar user={user} size="sm" className={cn('shadow-md ring-2', avatarRing)} />
        <ChevronDown
          className={cn(
            'mr-0.5 size-4 shrink-0 transition-transform duration-200',
            overHero ? 'text-white/90' : 'text-[var(--muted-foreground)]',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className={cn(
            'absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),15.5rem)] overflow-hidden',
            'rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-150',
          )}
        >
          <div className="border-b border-[var(--border)] bg-[var(--muted)]/30 px-3 py-3">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                user={user}
                size="sm"
                className="size-9 ring-2 ring-[var(--background)] shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {displayName}
                </p>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{secondary}</p>
                {user.isGuest ? (
                  <span className="mt-1 inline-flex rounded-md bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    Guest
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="space-y-0.5 p-2">
            <MenuItem
              icon={<LayoutDashboard className="size-4" />}
              label="Dashboard"
              onClick={() => navigate(dashboardRoutes.root)}
            />
            <MenuItem
              icon={<UserRound className="size-4" />}
              label="Profile"
              onClick={() => navigate(dashboardRoutes.profile)}
            />
          </div>
          <div className="border-t border-[var(--border)] p-2">
            <MenuItem
              icon={<LogOut className="size-4" />}
              label="Sign out"
              variant="danger"
              onClick={() => void onLogout()}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
