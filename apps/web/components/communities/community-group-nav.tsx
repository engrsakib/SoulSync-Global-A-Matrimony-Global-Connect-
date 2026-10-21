'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { cn } from '@soulsync/ui/lib/utils';
import { canModerateCommunity } from '@soulsync/shared-types/communities';
import { viewerIsCommunityAdmin } from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';

type CommunityGroupNavProps = {
  community: CommunityDto;
  memberCount?: number | null;
  pendingJoinCount?: number | null;
};

export function CommunityGroupNav({
  community,
  memberCount,
  pendingJoinCount,
}: CommunityGroupNavProps) {
  const pathname = usePathname();
  const feedHref = memberRoutes.community(community.slug);
  const membersHref = memberRoutes.communityMembers(community.slug);
  const settingsHref = memberRoutes.communitySettings(community.slug);
  const membership = community.viewerMembership;
  const showSettings =
    viewerIsCommunityAdmin(membership) ||
    (membership?.status === 'ACTIVE' && canModerateCommunity(membership.role));

  const tabs = [
    { href: feedHref, label: 'Feed', active: pathname === feedHref },
    {
      href: membersHref,
      label:
        memberCount != null ? `Members (${memberCount})` : 'Members',
      active: pathname === membersHref || pathname.startsWith(`${membersHref}/`),
    },
  ];

  return (
    <nav
      className="flex flex-wrap items-center gap-1 border-b border-[var(--border)]/80 pb-px"
      aria-label="Community sections"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab.active
              ? 'border-[var(--color-brand-700)] text-[var(--color-brand-800)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]',
          )}
        >
          {tab.label}
        </Link>
      ))}
      {showSettings ? (
        <Link
          href={settingsHref}
          className={cn(
            '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            pathname === settingsHref
              ? 'border-[var(--color-brand-700)] text-[var(--color-brand-800)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]',
          )}
        >
          Settings
          {pendingJoinCount != null && pendingJoinCount > 0 ? (
            <span className="rounded-full bg-[var(--color-brand-700)] px-2 py-0.5 text-xs font-semibold text-white">
              {pendingJoinCount}
            </span>
          ) : null}
        </Link>
      ) : null}
    </nav>
  );
}
