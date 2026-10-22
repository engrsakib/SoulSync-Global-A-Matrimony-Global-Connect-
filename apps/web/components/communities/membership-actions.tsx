'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown } from 'lucide-react';
import { Button, buttonVariants } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { joinCommunity } from '@/lib/communities-client';
import { hasViewerPendingJoinRequest, isActiveMember } from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { useCurrentUser } from '@/hooks/use-current-user';

type MembershipActionsProps = {
  community: CommunityDto;
  onUpdated?: (community: CommunityDto) => void;
  size?: 'sm' | 'default';
  variant?: 'default' | 'groupHeader';
  /** Stretch the primary control to the container width (directory cards). */
  fullWidth?: boolean;
};

export function MembershipActions({
  community,
  onUpdated,
  size = 'default',
  variant = 'default',
  fullWidth = false,
}: MembershipActionsProps) {
  const widthClass = fullWidth ? 'w-full' : undefined;
  const [busy, setBusy] = useState(false);
  const { user } = useCurrentUser();

  const hasUsername = Boolean(user?.username?.trim());

  if (isActiveMember(community)) {
    if (variant === 'groupHeader') {
      return (
        <Button
          type="button"
          variant="outline"
          size={size}
          className="gap-1.5 bg-[var(--muted)]"
          disabled
          aria-current="true"
        >
          <Check className="h-4 w-4" aria-hidden />
          Joined
          <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
        </Button>
      );
    }
    return (
      <Link
        href={memberRoutes.community(community.slug)}
        className={cn(buttonVariants({ size, variant: 'default' }), widthClass)}
      >
        Open
      </Link>
    );
  }

  const isPrivate = community.privacy === 'PRIVATE';
  const requested = hasViewerPendingJoinRequest(community);
  const label = isPrivate ? 'Request to join' : 'Join';

  if (requested) {
    return (
      <Button size={size} variant="outline" disabled className={cn('gap-1.5', widthClass)}>
        Requested
      </Button>
    );
  }

  if (!hasUsername) {
    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        <Button
          size={size}
          variant={isPrivate ? 'outline' : 'default'}
          disabled
          className={widthClass}
          title="Set a username to join groups"
        >
          {label}
        </Button>
        <p className="text-xs text-[var(--muted-foreground)]">
          <Link
            href={dashboardRoutes.settings}
            className="font-medium text-[var(--color-brand-700)] hover:underline"
          >
            Set a username
          </Link>{' '}
          in account settings to join groups.
        </p>
      </div>
    );
  }

  async function handleJoin() {
    setBusy(true);
    try {
      const result = await joinCommunity(community.slug);
      if ('slug' in result && result.slug) {
        toast.success(isPrivate ? 'Join request sent' : 'You joined the group');
        onUpdated?.(result);
      } else if ('status' in result) {
        toast.success('Join request sent');
        onUpdated?.({ ...community, viewerPendingJoinRequest: true });
      } else {
        toast.success('Join request sent');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not join');
    } finally {
      setBusy(false);
    }
  }

  if (variant === 'groupHeader') {
    return (
      <Button
        size={size}
        variant="default"
        disabled={busy}
        onClick={() => {
          void handleJoin();
        }}
      >
        {busy ? 'Please wait…' : label}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={isPrivate ? 'outline' : 'default'}
      disabled={busy}
      className={widthClass}
      onClick={() => {
        void handleJoin();
      }}
    >
      {busy ? 'Please wait…' : label}
    </Button>
  );
}
