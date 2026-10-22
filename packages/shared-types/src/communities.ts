export const COMMUNITY_PRIVACY_VALUES = ['PUBLIC', 'PRIVATE'] as const;
export type CommunityPrivacyDto = (typeof COMMUNITY_PRIVACY_VALUES)[number];

export const COMMUNITY_POST_APPROVAL_MODES = [
  'AUTO_APPROVE',
  'ALL_PENDING',
  'TRUSTED_AUTO_REST_PENDING',
] as const;
export type CommunityPostApprovalModeDto = (typeof COMMUNITY_POST_APPROVAL_MODES)[number];

export const COMMUNITY_MEMBER_ROLES = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'] as const;
export type CommunityMemberRoleDto = (typeof COMMUNITY_MEMBER_ROLES)[number];

export const COMMUNITY_MEMBER_STATUSES = [
  'PENDING',
  'ACTIVE',
  'BLOCKED',
  'REMOVED',
  'LEFT',
] as const;
export type CommunityMemberStatusDto = (typeof COMMUNITY_MEMBER_STATUSES)[number];

export const COMMUNITY_POST_STATUSES = ['SCHEDULED', 'PENDING', 'PUBLISHED', 'REJECTED'] as const;
export type CommunityPostStatusDto = (typeof COMMUNITY_POST_STATUSES)[number];

export const COMMUNITY_REACTION_KINDS = [
  'LIKE',
  'LOVE',
  'CARE',
  'HAHA',
  'WOW',
  'SAD',
  'ANGRY',
] as const;
export type CommunityReactionKindDto = (typeof COMMUNITY_REACTION_KINDS)[number];

export const COMMUNITY_JOIN_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'DENIED'] as const;
export type CommunityJoinRequestStatusDto = (typeof COMMUNITY_JOIN_REQUEST_STATUSES)[number];

export type CommunityAuthorDto = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
};

export type CommunityDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  allowedReligions: string[];
  allowedCountries: string[];
  minAge: number | null;
  maxAge: number | null;
  privacy: CommunityPrivacyDto;
  postApprovalMode: CommunityPostApprovalModeDto;
  createdAt: string;
  viewerMembership: CommunityMemberSummaryDto | null;
  /** True when the viewer has a pending join request (private communities). */
  viewerPendingJoinRequest: boolean;
  activeMemberCount: number;
  memberAvatarPreview: CommunityAuthorDto[];
  /** Published posts since start of UTC day (directory cards). */
  postsToday: number;
  /** Published posts per day since community creation (1 decimal). */
  averagePostsPerDay: number;
};

export type CommunityMemberSummaryDto = {
  role: CommunityMemberRoleDto;
  status: CommunityMemberStatusDto;
  isTrustedPoster: boolean;
};

export type CreateCommunityDto = {
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
  allowedReligions?: string[];
  allowedCountries?: string[];
  minAge?: number | null;
  maxAge?: number | null;
  privacy?: CommunityPrivacyDto;
  postApprovalMode?: CommunityPostApprovalModeDto;
};

export type PatchCommunityDto = Partial<Omit<CreateCommunityDto, 'name'>> & {
  name?: string;
};

export type CommunityMemberDto = {
  id: string;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  role: CommunityMemberRoleDto;
  status: CommunityMemberStatusDto;
  isTrustedPoster: boolean;
  joinedAt: string;
};

export type PatchCommunityMemberDto = {
  role?: CommunityMemberRoleDto;
  isTrustedPoster?: boolean;
};

export type CommunityJoinRequestDto = {
  id: string;
  userId: string;
  username: string | null;
  message: string | null;
  status: CommunityJoinRequestStatusDto;
  createdAt: string;
  decidedAt: string | null;
};

export type CreateCommunityJoinRequestDto = {
  message?: string | null;
};

export type DecideCommunityJoinRequestDto = {
  decision: 'approve' | 'deny';
};

export type CommunityPostImageDto = {
  id: string;
  url: string;
  publicId: string | null;
  sortOrder: number;
  width: number | null;
  height: number | null;
};

export type ReactionSummaryDto = {
  kind: CommunityReactionKindDto;
  count: number;
};

export type CommunityFeedSortDto = 'ranked' | 'recent';

export type CommunityPostEngagementDto = {
  reactionsCount: number;
  commentsCount: number;
  sharesCount: number;
};

export type CommunityPostDto = {
  id: string;
  communitySlug: string;
  bodyText: string | null;
  status: CommunityPostStatusDto;
  publishedAt: string | null;
  rejectReason: string | null;
  shareToken: string;
  author: CommunityAuthorDto;
  referencedUser: CommunityAuthorDto | null;
  images: CommunityPostImageDto[];
  reactionSummary: ReactionSummaryDto[];
  viewerReaction: CommunityReactionKindDto | null;
  commentCount: number;
  engagement: CommunityPostEngagementDto;
  /** Present when feed sort is ranked (personalized score). */
  rankScore?: number;
  createdAt: string;
  scheduledPublishAt: string | null;
  /** Cross-group home feed (optional). */
  communityName?: string;
};

export type CreateCommunityPostDto = {
  bodyText?: string | null;
  referencedUserId?: string | null;
  scheduledPublishAt?: string | null;
  images?: {
    url: string;
    publicId?: string | null;
    sortOrder?: number;
    width?: number | null;
    height?: number | null;
  }[];
};

export type PatchCommunityPostVisibilityDto = 'PUBLISHED' | 'PENDING';

export type PatchCommunityPostDto = {
  bodyText?: string | null;
  status?: PatchCommunityPostVisibilityDto;
};

export type DecideCommunityPostDto = {
  decision: 'approve' | 'reject';
  rejectReason?: string | null;
};

export type CommunityFeedDto = {
  items: CommunityPostDto[];
  nextCursor: string | null;
  pendingCount: number | null;
  sort: CommunityFeedSortDto;
};

export type CommunityPostShareResultDto = {
  sharesCount: number;
};

export type CommunityCommentViewerActionsDto = {
  canEdit: boolean;
  canDelete: boolean;
  canHide: boolean;
  canUnhide: boolean;
  canPin: boolean;
  canUnpin: boolean;
};

export type CommunityCommentDto = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  bodyText: string;
  author: CommunityAuthorDto;
  reactionSummary: ReactionSummaryDto[];
  viewerReaction: CommunityReactionKindDto | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  isHidden: boolean;
  pinnedRank: number | null;
  /** Replies in thread (top-level comments only; 0 for replies). */
  replyCount: number;
  viewerActions: CommunityCommentViewerActionsDto;
};

export type CreateCommunityCommentDto = {
  bodyText: string;
  parentCommentId?: string | null;
};

export type PatchCommunityCommentDto = {
  bodyText?: string;
};

export type PinCommunityCommentDto = {
  pinned: boolean;
};

export const MAX_PINNED_COMMENTS_PER_POST = 3;

const COMMUNITY_MENTION_PATTERN = /(?:^|[\s([{"'])@([a-zA-Z0-9_]{2,32})/g;

export function parseCommunityMentionUsernames(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const re = new RegExp(COMMUNITY_MENTION_PATTERN.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const username = match[1]?.toLowerCase();
    if (username && !seen.has(username)) {
      seen.add(username);
      out.push(username);
    }
  }
  return out;
}

export function canViewHiddenCommunityComment(input: {
  viewerUserId: string | null | undefined;
  commentAuthorId: string;
  postAuthorId: string;
  role: CommunityMemberRoleDto | null | undefined;
}): boolean {
  const { viewerUserId, commentAuthorId, postAuthorId, role } = input;
  if (viewerUserId && viewerUserId === commentAuthorId) {
    return true;
  }
  if (viewerUserId && viewerUserId === postAuthorId) {
    return true;
  }
  return role != null && canModerateCommunity(role);
}

function canManageCommentOnPost(input: {
  viewerUserId: string;
  postAuthorId: string;
  role: CommunityMemberRoleDto | null | undefined;
}): boolean {
  if (input.viewerUserId === input.postAuthorId) {
    return true;
  }
  return input.role != null && canModerateCommunity(input.role);
}

export function canEditCommunityComment(input: {
  viewerUserId: string;
  commentAuthorId: string;
  deletedAt?: string | null;
}): boolean {
  if (input.deletedAt) {
    return false;
  }
  return input.viewerUserId === input.commentAuthorId;
}

export function canDeleteCommunityComment(input: {
  viewerUserId: string;
  commentAuthorId: string;
  postAuthorId: string;
  role: CommunityMemberRoleDto | null | undefined;
  deletedAt?: string | null;
}): boolean {
  if (input.deletedAt) {
    return false;
  }
  if (input.viewerUserId === input.commentAuthorId) {
    return true;
  }
  return canManageCommentOnPost(input);
}

export function canHideCommunityComment(input: {
  viewerUserId: string;
  postAuthorId: string;
  role: CommunityMemberRoleDto | null | undefined;
  hiddenAt?: string | null;
  deletedAt?: string | null;
}): boolean {
  if (input.deletedAt || input.hiddenAt) {
    return false;
  }
  return canManageCommentOnPost(input);
}

export function canUnhideCommunityComment(input: {
  viewerUserId: string;
  postAuthorId: string;
  role: CommunityMemberRoleDto | null | undefined;
  hiddenAt?: string | null;
  deletedAt?: string | null;
}): boolean {
  if (input.deletedAt || !input.hiddenAt) {
    return false;
  }
  return canManageCommentOnPost(input);
}

export function canPinCommunityComment(input: {
  viewerUserId: string;
  postAuthorId: string;
  role: CommunityMemberRoleDto | null | undefined;
  pinnedRank?: number | null;
  deletedAt?: string | null;
  hiddenAt?: string | null;
}): boolean {
  if (input.deletedAt || input.hiddenAt || input.pinnedRank != null) {
    return false;
  }
  return canManageCommentOnPost(input);
}

export function canUnpinCommunityComment(input: {
  viewerUserId: string;
  postAuthorId: string;
  role: CommunityMemberRoleDto | null | undefined;
  pinnedRank?: number | null;
  deletedAt?: string | null;
}): boolean {
  if (input.deletedAt || input.pinnedRank == null) {
    return false;
  }
  return canManageCommentOnPost(input);
}

export function buildCommunityCommentViewerActions(input: {
  viewerUserId: string;
  commentAuthorId: string;
  postAuthorId: string;
  role: CommunityMemberRoleDto | null | undefined;
  hiddenAt?: Date | string | null;
  pinnedRank?: number | null;
  deletedAt?: Date | string | null;
}): CommunityCommentViewerActionsDto {
  const hiddenAt =
    input.hiddenAt instanceof Date ? input.hiddenAt.toISOString() : (input.hiddenAt ?? null);
  const deletedAt =
    input.deletedAt instanceof Date ? input.deletedAt.toISOString() : (input.deletedAt ?? null);

  return {
    canEdit: canEditCommunityComment({
      viewerUserId: input.viewerUserId,
      commentAuthorId: input.commentAuthorId,
      deletedAt,
    }),
    canDelete: canDeleteCommunityComment({
      viewerUserId: input.viewerUserId,
      commentAuthorId: input.commentAuthorId,
      postAuthorId: input.postAuthorId,
      role: input.role,
      deletedAt,
    }),
    canHide: canHideCommunityComment({
      viewerUserId: input.viewerUserId,
      postAuthorId: input.postAuthorId,
      role: input.role,
      hiddenAt,
      deletedAt,
    }),
    canUnhide: canUnhideCommunityComment({
      viewerUserId: input.viewerUserId,
      postAuthorId: input.postAuthorId,
      role: input.role,
      hiddenAt,
      deletedAt,
    }),
    canPin: canPinCommunityComment({
      viewerUserId: input.viewerUserId,
      postAuthorId: input.postAuthorId,
      role: input.role,
      pinnedRank: input.pinnedRank,
      deletedAt,
      hiddenAt,
    }),
    canUnpin: canUnpinCommunityComment({
      viewerUserId: input.viewerUserId,
      postAuthorId: input.postAuthorId,
      role: input.role,
      pinnedRank: input.pinnedRank,
      deletedAt,
    }),
  };
}

export type SetCommunityReactionDto = {
  kind: CommunityReactionKindDto;
};

export type CommunityPostShareDto = {
  shareToken: string;
  communityName: string;
  communitySlug: string;
  authorUsername: string | null;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
};

export type CommunityMemberPostsDto = {
  member: CommunityMemberDto;
  feed: CommunityFeedDto;
};

const MOD_ROLES: ReadonlySet<CommunityMemberRoleDto> = new Set(['OWNER', 'ADMIN', 'MODERATOR']);
const ADMIN_ROLES: ReadonlySet<CommunityMemberRoleDto> = new Set(['OWNER', 'ADMIN']);

export function canModerateCommunity(role: CommunityMemberRoleDto): boolean {
  return MOD_ROLES.has(role);
}

export function isCommunityAdminRole(role: CommunityMemberRoleDto): boolean {
  return ADMIN_ROLES.has(role);
}

export function isCommunityOwnerRole(role: CommunityMemberRoleDto): boolean {
  return role === 'OWNER';
}

function normalizeCommunityUsername(value: string | null | undefined): string | null {
  const trimmed = value?.trim().replace(/^@+/, '').toLowerCase();
  return trimmed ? trimmed : null;
}

export function viewerIsCommunityPostAuthor(
  post: { author: { id: string; username: string | null } },
  viewerUserId: string | null | undefined,
  viewerUsername: string | null | undefined,
): boolean {
  if (viewerUserId && post.author.id && post.author.id === viewerUserId) {
    return true;
  }
  const authorName = normalizeCommunityUsername(post.author.username);
  const viewerName = normalizeCommunityUsername(viewerUsername);
  return Boolean(authorName && viewerName && authorName === viewerName);
}

export function canAuthorManageOwnPost(
  postAuthorId: string,
  viewerUserId: string,
  status: CommunityPostStatusDto,
): boolean {
  if (postAuthorId !== viewerUserId) {
    return false;
  }
  return status === 'PUBLISHED' || status === 'PENDING';
}

export function canAdminManageCommunityPost(
  role: CommunityMemberRoleDto | null | undefined,
): boolean {
  return role != null && isCommunityAdminRole(role);
}

export function canEditCommunityPost(
  post: { author: { id: string; username: string | null }; status: CommunityPostStatusDto },
  viewerUserId: string | null | undefined,
  role: CommunityMemberRoleDto | null | undefined,
  viewerUsername?: string | null,
): boolean {
  if (!viewerUserId && !viewerUsername) {
    return false;
  }
  if (post.status === 'SCHEDULED' || post.status === 'REJECTED') {
    return false;
  }
  if (viewerIsCommunityPostAuthor(post, viewerUserId, viewerUsername)) {
    return post.status === 'PUBLISHED' || post.status === 'PENDING';
  }
  return canAdminManageCommunityPost(role);
}

export function canDeleteCommunityPost(
  post: { author: { id: string; username: string | null }; status: CommunityPostStatusDto },
  viewerUserId: string | null | undefined,
  role: CommunityMemberRoleDto | null | undefined,
  viewerUsername?: string | null,
): boolean {
  if (!viewerUserId && !viewerUsername) {
    return false;
  }
  if (viewerIsCommunityPostAuthor(post, viewerUserId, viewerUsername)) {
    return post.status === 'PUBLISHED' || post.status === 'PENDING';
  }
  return canAdminManageCommunityPost(role);
}

export function canChangeCommunityPostVisibility(
  post: { status: CommunityPostStatusDto },
  role: CommunityMemberRoleDto | null | undefined,
): boolean {
  if (!canAdminManageCommunityPost(role)) {
    return false;
  }
  return post.status === 'PUBLISHED' || post.status === 'PENDING';
}
