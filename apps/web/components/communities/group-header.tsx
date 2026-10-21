'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { PrivacyBadge } from './privacy-badge';
import { MembershipActions } from './membership-actions';
import { memberRoutes } from '@/lib/member-routes';
import { isActiveMember } from '@/lib/communities-format';
import { CommunityRoleBadge } from './community-role-badge';

type GroupHeaderProps = {
  community: CommunityDto;
  onCommunityUpdate?: (community: CommunityDto) => void;
};

export function GroupHeader({ community, onCommunityUpdate }: GroupHeaderProps) {
  const member = isActiveMember(community);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] shadow-sm">
      <div className="relative h-36 w-full bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] sm:h-44">
        {community.coverImageUrl ? (
          <Image src={community.coverImageUrl} alt="" fill className="object-cover" priority sizes="100vw" />
        ) : null}
      </div>
      <div className="space-y-3 px-4 py-4 sm:px-6">
        <Link
          href={memberRoutes.communities}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All communities
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{community.name}</h1>
              <PrivacyBadge privacy={community.privacy} />
            </div>
            {community.description ? (
              <p className="max-w-2xl text-sm text-[var(--muted-foreground)]">{community.description}</p>
            ) : null}
          </div>
          {member && community.viewerMembership ? (
            <CommunityRoleBadge role={community.viewerMembership.role} />
          ) : (
            <MembershipActions community={community} onUpdated={onCommunityUpdate} />
          )}
        </div>
      </div>
    </div>
  );
}
