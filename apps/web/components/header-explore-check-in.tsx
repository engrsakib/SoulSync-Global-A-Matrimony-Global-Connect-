'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonVariants } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import type { PublicUser } from '@/lib/auth-api';
import { fetchCheckInStatus, performCheckIn } from '@/lib/check-in-api';

import { dashboardRoutes } from '@/lib/dashboard-routes';

const EXPLORE_HREF = dashboardRoutes.communities;

type HeaderExploreCheckInProps = {
  user: PublicUser | null;
  overHero: boolean;
  size?: 'sm' | 'lg';
  className?: string;
  onNavigate?: () => void;
};

type LoggedInProps = {
  overHero: boolean;
  size: 'sm' | 'lg';
  className?: string;
  onNavigate?: () => void;
};

function LoggedInExploreCheckIn({ overHero, size, className, onNavigate }: LoggedInProps) {
  const router = useRouter();
  const [checkedInToday, setCheckedInToday] = React.useState<boolean | null>(null);
  const [checkingIn, setCheckingIn] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void fetchCheckInStatus()
      .then((status) => {
        if (!cancelled) {
          setCheckedInToday(status.checkedInToday);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCheckedInToday(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const exploreClass = cn(
    buttonVariants({ variant: overHero ? 'outline' : 'default', size }),
    overHero && 'border-white/40 bg-transparent text-white hover:bg-white/10',
    className,
  );

  const goExplore = React.useCallback(() => {
    onNavigate?.();
    router.push(EXPLORE_HREF);
  }, [onNavigate, router]);

  if (checkedInToday === null) {
    return (
      <span
        className={cn(exploreClass, 'pointer-events-none opacity-70')}
        aria-busy="true"
        aria-label="Loading check-in status"
      >
        …
      </span>
    );
  }

  if (checkedInToday) {
    return (
      <Link href={EXPLORE_HREF} className={exploreClass} onClick={onNavigate}>
        Explore
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={exploreClass}
      disabled={checkingIn}
      onClick={() => {
        setCheckingIn(true);
        void performCheckIn()
          .then((result) => {
            setCheckedInToday(true);
            if (result.alreadyCheckedIn) {
              goExplore();
              return;
            }
            toast.success(`Checked in! +${result.pointsAwarded} points`);
            goExplore();
          })
          .catch((error: unknown) => {
            toast.error(error instanceof Error ? error.message : 'Check-in failed');
          })
          .finally(() => {
            setCheckingIn(false);
          });
      }}
    >
      {checkingIn ? 'Checking in…' : 'Check in'}
    </button>
  );
}

export function HeaderExploreCheckIn({
  user,
  overHero,
  size = 'sm',
  className,
  onNavigate,
}: HeaderExploreCheckInProps) {
  const exploreClass = cn(
    buttonVariants({ variant: overHero ? 'outline' : 'default', size }),
    overHero && 'border-white/40 bg-transparent text-white hover:bg-white/10',
    className,
  );

  if (!user) {
    return (
      <Link href={EXPLORE_HREF} className={exploreClass} onClick={onNavigate}>
        Explore
      </Link>
    );
  }

  return (
    <LoggedInExploreCheckIn
      overHero={overHero}
      size={size}
      className={className}
      onNavigate={onNavigate}
    />
  );
}
