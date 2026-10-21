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

export const COMMUNITY_POST_STATUSES = ['PENDING', 'PUBLISHED', 'REJECTED'] as const;
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
  createdAt: string;
};

export type CreateCommunityPostDto = {
  bodyText?: string | null;
  referencedUserId?: string | null;
  images?: {
    url: string;
    publicId?: string | null;
    sortOrder?: number;
    width?: number | null;
    height?: number | null;
  }[];
};

export type PatchCommunityPostDto = {
  bodyText?: string | null;
};

export type DecideCommunityPostDto = {
  decision: 'approve' | 'reject';
  rejectReason?: string | null;
};

export type CommunityFeedDto = {
  items: CommunityPostDto[];
  nextCursor: string | null;
  pendingCount: number | null;
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
};

export type CreateCommunityCommentDto = {
  bodyText: string;
  parentCommentId?: string | null;
};

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
