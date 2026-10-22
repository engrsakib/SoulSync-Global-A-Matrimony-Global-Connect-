import type {
  CommunityMemberDto,
  CommunityMemberRoleDto,
  CommunityMemberSummaryDto,
  CommunityPrivacyDto,
} from '@soulsync/shared-types/communities';
import { memberRoutes } from '@/lib/member-routes';
import { isCommunityAdminRole } from '@soulsync/shared-types/communities';

/** Fixed locale so SSR and client hydration produce identical date strings. */
const COMMUNITY_DISPLAY_LOCALE = 'en-US';

const ROLE_SORT_ORDER: Record<CommunityMemberRoleDto, number> = {
  OWNER: 0,
  ADMIN: 1,
  MODERATOR: 2,
  MEMBER: 3,
};

export function formatCommunityAuthorUsername(username: string | null): string {
  if (username?.trim()) {
    return `@${username.trim()}`;
  }
  return 'Member';
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(COMMUNITY_DISPLAY_LOCALE, { numeric: 'auto' });

  if (absSec < 60) {
    return rtf.format(diffSec, 'second');
  }
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  }
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  }
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, 'day');
  }
  return date.toLocaleDateString(COMMUNITY_DISPLAY_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isActiveMember(community: {
  viewerMembership: { status: string } | null;
}): boolean {
  return community.viewerMembership?.status === 'ACTIVE';
}

export function hasViewerPendingJoinRequest(community: {
  viewerPendingJoinRequest?: boolean;
}): boolean {
  return Boolean(community.viewerPendingJoinRequest);
}

export function communityRoleLabel(role: CommunityMemberRoleDto): string {
  switch (role) {
    case 'OWNER':
      return 'Owner';
    case 'ADMIN':
      return 'Admin';
    case 'MODERATOR':
      return 'Moderator';
    default:
      return 'Member';
  }
}

export function viewerIsCommunityAdmin(
  membership: CommunityMemberSummaryDto | null | undefined,
): boolean {
  if (!membership || membership.status !== 'ACTIVE') {
    return false;
  }
  return isCommunityAdminRole(membership.role);
}

export function isCommunityTeamRole(role: CommunityMemberRoleDto): boolean {
  return role !== 'MEMBER';
}

export function sortCommunityMembers(members: CommunityMemberDto[]): CommunityMemberDto[] {
  return [...members].sort((a, b) => {
    const roleDiff = ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
    if (roleDiff !== 0) {
      return roleDiff;
    }
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });
}

export function formatCommunityPostTimestamp(
  iso: string | null | undefined,
  timeZone?: string | null,
): { relative: string; absolute: string } {
  const relative = formatRelativeTime(iso);
  if (!iso) {
    return { relative: '', absolute: '' };
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { relative, absolute: '' };
  }
  const absolute = date.toLocaleString(COMMUNITY_DISPLAY_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  });
  return { relative, absolute };
}

export function communityPostShareUrl(shareToken: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/share/post/${encodeURIComponent(shareToken)}`;
  }
  return `/share/post/${encodeURIComponent(shareToken)}`;
}

export async function copyCommunityPostShareLink(shareToken: string): Promise<void> {
  const url = communityPostShareUrl(shareToken);
  await navigator.clipboard.writeText(url);
}

export function communityGroupUrl(slug: string): string {
  const path = memberRoutes.community(slug);
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export async function copyCommunityGroupLink(slug: string): Promise<void> {
  await navigator.clipboard.writeText(communityGroupUrl(slug));
}

export function formatCommunityMemberCount(count: number | undefined | null): string {
  const n = count ?? 0;
  if (n < 1000) {
    return String(n);
  }
  if (n < 1_000_000) {
    const compact = n / 1000;
    const rounded = compact >= 10 ? Math.round(compact) : Math.round(compact * 10) / 10;
    return `${rounded}K`;
  }
  const compact = n / 1_000_000;
  const rounded = compact >= 10 ? Math.round(compact) : Math.round(compact * 10) / 10;
  return `${rounded}M`;
}

export function formatCommunityPrivacyLabel(privacy: CommunityPrivacyDto): string {
  return privacy === 'PRIVATE' ? 'Private group' : 'Public group';
}

export function formatJoinedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(COMMUNITY_DISPLAY_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
