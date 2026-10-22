export type UserLabelSource = {
  id: string;
  tenantId: string;
  username: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profile?: { displayName: string | null } | null;
};

export function toUserSnippet(user: UserLabelSource): UserLabelSource {
  return user;
}

export function buildUserActivityLabel(user: UserLabelSource): string {
  const displayName = user.profile?.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  const first = user.firstName?.trim() ?? '';
  const last = user.lastName?.trim() ?? '';
  const full = `${first} ${last}`.trim();
  if (full) {
    return full;
  }
  const username = user.username?.trim().replace(/^@+/, '');
  if (username) {
    return `@${username}`;
  }
  return 'Member';
}

export function memberBiodataLinkPath(username: string | null | undefined): string {
  const trimmed = username?.trim().replace(/^@+/, '').toLowerCase();
  if (!trimmed) {
    return '/dashboard/biodata';
  }
  return `/biodata/${encodeURIComponent(trimmed)}`;
}

export function dashboardPermissionRequestsPath(): string {
  return '/dashboard/biodata/permission-requests';
}

export function communityPostLinkPath(slug: string, postId: string, commentId?: string): string {
  const base = `/communities/${encodeURIComponent(slug)}#post-${postId}`;
  if (commentId) {
    return `${base}-comment-${commentId}`;
  }
  return base;
}

export function managedBiodataEditPath(ownerUsername: string): string {
  const trimmed = ownerUsername.trim().replace(/^@+/, '');
  return `/dashboard/biodata/managed/${encodeURIComponent(trimmed)}/edit`;
}
