'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { cn } from '@soulsync/ui/lib/utils';
import { logoutSession, type PublicUser } from '@/lib/auth-api';
import { notifyAuthSessionChanged } from '@/lib/auth-session';
import { userDisplayLabel, userInitials } from '@/lib/user-display';

type HeaderAccountMenuProps = {
  user: PublicUser;
  overHero?: boolean;
  className?: string;
  onNavigate?: () => void;
};

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

  const goToProfile = () => {
    setOpen(false);
    onNavigate?.();
    router.push('/profile');
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
        className="rounded-full focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar
          className={cn(
            'h-10 w-10 shadow-md ring-2',
            avatarRing,
            'bg-gradient-to-br from-[var(--color-brand-600)] to-blue-600',
          )}
        >
          <AvatarFallback className="bg-transparent text-sm font-semibold text-white">
            {userInitials(user)}
          </AvatarFallback>
        </Avatar>
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute right-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] py-1 shadow-lg',
          )}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full truncate px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
            onClick={goToProfile}
          >
            {userDisplayLabel(user)}
          </button>
          <div className="border-t border-[var(--border)]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
            onClick={goToProfile}
          >
            Profile & dashboard
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
            onClick={() => void onLogout()}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
