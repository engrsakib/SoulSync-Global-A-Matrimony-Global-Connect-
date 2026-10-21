'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Globe, Lock } from 'lucide-react';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import {
  formatCommunityMemberCount,
  formatCommunityPrivacyLabel,
  isActiveMember,
  viewerIsCommunityAdmin,
} from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';
import { GroupCoverEditor } from './group-cover-editor';
import { GroupMemberAvatarStack } from './group-member-avatar-stack';
import { GroupHeaderActions } from './group-header-actions';

type GroupHeaderProps = {
  community: CommunityDto;
  onCommunityUpdate?: (community: CommunityDto) => void;
};

export function GroupHeader({ community, onCommunityUpdate }: GroupHeaderProps) {
  const isAdmin = viewerIsCommunityAdmin(community.viewerMembership);
  const member = isActiveMember(community);
  const isPrivate = community.privacy === 'PRIVATE';
  const activeMemberCount = community.activeMemberCount ?? 0;
  const memberAvatarPreview = community.memberAvatarPreview ?? [];
  const memberLabel = `${formatCommunityMemberCount(activeMemberCount)} member${
    activeMemberCount === 1 ? '' : 's'
  }`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] shadow-sm">
      <div className="group/cover relative aspect-[16/6] min-h-40 w-full bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] sm:min-h-48">
        {community.coverImageUrl ? (
          <Image
            src={community.coverImageUrl}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 980px"
          />
        ) : null}
        {isAdmin && onCommunityUpdate ? (
          <GroupCoverEditor community={community} onUpdated={onCommunityUpdate} />
        ) : null}
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-6">
        <Link
          href={memberRoutes.communities}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All communities
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{community.name}</h1>
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
            {isPrivate ? (
              <Lock className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>
              {formatCommunityPrivacyLabel(community.privacy)} · {memberLabel}
            </span>
          </p>
          {community.description ? (
            <p className="max-w-2xl pt-1 text-sm text-[var(--muted-foreground)]">
              {community.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <GroupMemberAvatarStack slug={community.slug} members={memberAvatarPreview} />
          <GroupHeaderActions
            community={community}
            onCommunityUpdate={onCommunityUpdate}
            className="sm:justify-end"
          />
        </div>

        {!member && !community.viewerMembership ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            Join to post and see the full member list.
          </p>
        ) : null}
      </div>
    </div>
  );
}
