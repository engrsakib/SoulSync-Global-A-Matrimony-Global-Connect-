'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@soulsync/ui/card';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { cn } from '@soulsync/ui/lib/utils';
import { PrivacyBadge } from './privacy-badge';
import { MembershipActions } from './membership-actions';
import { memberRoutes } from '@/lib/member-routes';
import {
  formatCommunityAveragePostsPerDay,
  formatCommunityMemberCount,
  formatCommunityPostsToday,
  hasViewerPendingJoinRequest,
  isActiveMember,
} from '@/lib/communities-format';

type CommunityCardProps = {
  community: CommunityDto;
  onMembershipChange?: (community: CommunityDto) => void;
};

export function CommunityCard({ community, onMembershipChange }: CommunityCardProps) {
  const member = isActiveMember(community);
  const requested = hasViewerPendingJoinRequest(community);

  return (
    <Card className="overflow-hidden border-[var(--border)]/80 shadow-sm transition-shadow hover:shadow-md">
      <Link href={memberRoutes.community(community.slug)} className="block">
        <div
          className={cn(
            'relative h-28 w-full bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)]',
          )}
        >
          {community.coverImageUrl ? (
            <Image
              src={community.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : null}
        </div>
      </Link>
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={memberRoutes.community(community.slug)}
            className="line-clamp-2 text-lg leading-snug font-semibold hover:underline"
          >
            {community.name}
          </Link>
          <PrivacyBadge privacy={community.privacy} />
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          {formatCommunityMemberCount(community.activeMemberCount)} member
          {community.activeMemberCount === 1 ? '' : 's'}
          {' · '}
          {formatCommunityPostsToday(community.postsToday ?? 0)}
          {' · '}
          {formatCommunityAveragePostsPerDay(community.averagePostsPerDay ?? 0)} avg/day
        </p>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 pb-2">
        {member ? (
          <p className="text-xs font-medium text-[var(--color-brand-700)]">You&apos;re a member</p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-[var(--muted-foreground)]">
              {community.privacy === 'PRIVATE'
                ? 'Approval required to join'
                : 'Open to eligible members'}
            </p>
            {community.privacy === 'PRIVATE' && requested ? (
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                Requested · awaiting approval
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
      <div className="px-6 pt-0 pb-6">
        <MembershipActions
          community={community}
          onUpdated={onMembershipChange}
          size="sm"
          fullWidth
        />
      </div>
    </Card>
  );
}
