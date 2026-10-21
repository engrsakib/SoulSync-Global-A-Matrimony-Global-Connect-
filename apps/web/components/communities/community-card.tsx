'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@soulsync/ui/card';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { cn } from '@soulsync/ui/lib/utils';
import { PrivacyBadge } from './privacy-badge';
import { MembershipActions } from './membership-actions';
import { memberRoutes } from '@/lib/member-routes';
import { isActiveMember } from '@/lib/communities-format';

type CommunityCardProps = {
  community: CommunityDto;
  onMembershipChange?: (community: CommunityDto) => void;
};

export function CommunityCard({ community, onMembershipChange }: CommunityCardProps) {
  const member = isActiveMember(community);

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
            className="line-clamp-2 text-lg font-semibold leading-snug hover:underline"
          >
            {community.name}
          </Link>
          <PrivacyBadge privacy={community.privacy} />
        </div>
        {community.description ? (
          <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">{community.description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="pb-2 pt-0">
        {member ? (
          <p className="text-xs font-medium text-[var(--color-brand-700)]">You&apos;re a member</p>
        ) : (
          <p className="text-xs text-[var(--muted-foreground)]">
            {community.privacy === 'PRIVATE' ? 'Approval required to join' : 'Open to eligible members'}
          </p>
        )}
      </CardContent>
      <div className="flex gap-2 px-6 pb-6 pt-0">
        <MembershipActions community={community} onUpdated={onMembershipChange} size="sm" />
      </div>
    </Card>
  );
}
