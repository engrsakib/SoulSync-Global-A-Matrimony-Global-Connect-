'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { joinCommunity } from '@/lib/communities-client';
import { isActiveMember } from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';

type MembershipActionsProps = {
  community: CommunityDto;
  onUpdated?: (community: CommunityDto) => void;
  size?: 'sm' | 'default';
};

export function MembershipActions({ community, onUpdated, size = 'default' }: MembershipActionsProps) {
  const [busy, setBusy] = useState(false);

  if (isActiveMember(community)) {
    return (
      <Link
        href={memberRoutes.community(community.slug)}
        className={cn(buttonVariants({ size, variant: 'default' }))}
      >
        Open
      </Link>
    );
  }

  const isPrivate = community.privacy === 'PRIVATE';
  const label = isPrivate ? 'Request to join' : 'Join';

  async function handleJoin() {
    setBusy(true);
    try {
      const result = await joinCommunity(community.slug);
      if ('slug' in result && result.slug) {
        toast.success(isPrivate ? 'Join request sent' : 'You joined the group');
        onUpdated?.(result);
      } else {
        toast.success('Join request sent');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not join');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size={size}
      variant={isPrivate ? 'outline' : 'default'}
      disabled={busy}
      onClick={() => {
        void handleJoin();
      }}
    >
      {busy ? 'Please wait…' : label}
    </Button>
  );
}
