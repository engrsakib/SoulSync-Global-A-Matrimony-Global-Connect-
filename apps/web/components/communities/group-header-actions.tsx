'use client';

import { Share2, UserPlus } from 'lucide-react';
import { Button } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { copyCommunityGroupLink } from '@/lib/communities-format';
import { MembershipActions } from './membership-actions';

type GroupHeaderActionsProps = {
  community: CommunityDto;
  onCommunityUpdate?: (community: CommunityDto) => void;
  className?: string;
};

async function copyLink(slug: string, message: string) {
  try {
    await copyCommunityGroupLink(slug);
    toast.success(message);
  } catch {
    toast.error('Could not copy link');
  }
}

export function GroupHeaderActions({
  community,
  onCommunityUpdate,
  className,
}: GroupHeaderActionsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button
        type="button"
        variant="default"
        size="sm"
        className="gap-1.5"
        onClick={() => void copyLink(community.slug, 'Invite link copied to clipboard')}
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        Invite
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 bg-[var(--muted)]"
        onClick={() => void copyLink(community.slug, 'Link copied to clipboard')}
      >
        <Share2 className="h-4 w-4" aria-hidden />
        Share
      </Button>
      <MembershipActions
        community={community}
        onUpdated={onCommunityUpdate}
        size="sm"
        variant="groupHeader"
      />
    </div>
  );
}
