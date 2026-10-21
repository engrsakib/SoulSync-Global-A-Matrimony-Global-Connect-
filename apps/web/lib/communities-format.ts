import type {
  CommunityMemberDto,
  CommunityMemberRoleDto,
  CommunityMemberSummaryDto,
} from '@soulsync/shared-types/communities';
import { isCommunityAdminRole } from '@soulsync/shared-types/communities';

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
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

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
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isActiveMember(community: {
  viewerMembership: { status: string } | null;
}): boolean {
  return community.viewerMembership?.status === 'ACTIVE';
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
  const absolute = date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

export function formatJoinedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
