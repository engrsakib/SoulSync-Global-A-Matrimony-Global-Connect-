'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { canModerateCommunity } from '@soulsync/shared-types/communities';
import { ShieldAlert } from 'lucide-react';
import { buttonVariants } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';
import { viewerIsCommunityAdmin } from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';
import { GroupHeader } from './group-header';
import { CommunityGroupNav } from './community-group-nav';
import { CommunitySettingsForm } from './community-settings-form';
import { CommunityJoinRequestsPanel } from './community-join-requests-panel';

type CommunitySettingsPageProps = {
  initialCommunity: CommunityDto;
};

export function CommunitySettingsPage({ initialCommunity }: CommunitySettingsPageProps) {
  const [community, setCommunity] = useState(initialCommunity);
  const [pendingJoinCount, setPendingJoinCount] = useState<number | null>(null);

  const isAdmin = viewerIsCommunityAdmin(community.viewerMembership);
  const canModerate = community.viewerMembership
    ? canModerateCommunity(community.viewerMembership.role)
    : false;

  const handlePendingCount = useCallback((count: number) => {
    setPendingJoinCount(count);
  }, []);

  if (!isAdmin && !canModerate) {
    return (
      <div className="space-y-6">
        <GroupHeader community={community} onCommunityUpdate={setCommunity} />
        <CommunityGroupNav community={community} pendingJoinCount={pendingJoinCount} />
        <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">Admin access only</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Community settings are visible to owners, admins, and moderators only.
          </p>
          <Link
            href={memberRoutes.community(community.slug)}
            className={cn(buttonVariants({ variant: 'default' }), 'mt-6 inline-flex')}
          >
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GroupHeader community={community} onCommunityUpdate={setCommunity} />
      <CommunityGroupNav community={community} pendingJoinCount={pendingJoinCount} />

      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            {isAdmin ? 'Community settings' : 'Moderation'}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {isAdmin
              ? 'Update how members discover, join, and post in this community.'
              : 'Review join requests. Contact an owner or admin to change community details.'}
          </p>
        </div>

        {canModerate ? (
          <CommunityJoinRequestsPanel slug={community.slug} onPendingCountChange={handlePendingCount} />
        ) : null}

        {isAdmin ? (
          <CommunitySettingsForm community={community} onSaved={setCommunity} />
        ) : null}
      </div>
    </div>
  );
}
