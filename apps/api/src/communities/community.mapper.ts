import type {
  CommunityComment,
  CommunityMember,
  CommunityPost,
  CommunityPostImage,
  CommunityReaction,
  CommunityReactionKind,
  CommunityJoinRequest,
  Community as PrismaCommunity,
  User,
} from '@soulsync/db';
import type {
  CommunityAuthorDto,
  CommunityCommentDto,
  CommunityDto,
  CommunityJoinRequestDto,
  CommunityMemberDto,
  CommunityMemberSummaryDto,
  CommunityMemberRoleDto,
  CommunityPostDto,
  CommunityPostImageDto,
  CommunityPostShareDto,
  ReactionSummaryDto,
} from '@soulsync/shared-types/communities';
import {
  buildCommunityCommentViewerActions,
  canViewHiddenCommunityComment,
} from '@soulsync/shared-types/communities';

export const HIDDEN_COMMUNITY_COMMENT_PLACEHOLDER = 'This comment was hidden by a moderator.';

type UserPick = Pick<User, 'id' | 'username' | 'avatarUrl'>;
type ReactionPick = Pick<CommunityReaction, 'kind' | 'userId'>;

export function toAuthor(user: UserPick | null | undefined): CommunityAuthorDto {
  return {
    id: user?.id ?? '',
    username: user?.username ?? null,
    avatarUrl: user?.avatarUrl ?? null,
  };
}

export function toMemberSummary(
  member: CommunityMember | null | undefined,
): CommunityMemberSummaryDto | null {
  if (!member) {
    return null;
  }
  return {
    role: member.role,
    status: member.status,
    isTrustedPoster: member.isTrustedPoster,
  };
}

export type CommunityDtoExtras = {
  activeMemberCount?: number;
  memberAvatarPreview?: CommunityAuthorDto[];
  viewerPendingJoinRequest?: boolean;
  postsToday?: number;
  averagePostsPerDay?: number;
};

export function toCommunityDto(
  community: PrismaCommunity,
  viewerMembership: CommunityMember | null,
  extras?: CommunityDtoExtras,
): CommunityDto {
  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    description: community.description,
    coverImageUrl: community.coverImageUrl,
    allowedReligions: community.allowedReligions,
    allowedCountries: community.allowedCountries,
    minAge: community.minAge,
    maxAge: community.maxAge,
    privacy: community.privacy,
    postApprovalMode: community.postApprovalMode,
    createdAt: community.createdAt.toISOString(),
    viewerMembership: toMemberSummary(viewerMembership),
    viewerPendingJoinRequest: extras?.viewerPendingJoinRequest ?? false,
    activeMemberCount: extras?.activeMemberCount ?? 0,
    memberAvatarPreview: extras?.memberAvatarPreview ?? [],
    postsToday: extras?.postsToday ?? 0,
    averagePostsPerDay: extras?.averagePostsPerDay ?? 0,
  };
}

export function toMemberDto(member: CommunityMember & { user: UserPick }): CommunityMemberDto {
  return {
    id: member.id,
    userId: member.userId,
    username: member.user.username,
    avatarUrl: member.user.avatarUrl,
    role: member.role,
    status: member.status,
    isTrustedPoster: member.isTrustedPoster,
    joinedAt: member.joinedAt.toISOString(),
  };
}

export function toJoinRequestDto(
  row: CommunityJoinRequest & { user: UserPick },
): CommunityJoinRequestDto {
  return {
    id: row.id,
    userId: row.userId,
    username: row.user.username,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
  };
}

export function toPostImageDto(image: CommunityPostImage): CommunityPostImageDto {
  return {
    id: image.id,
    url: image.url,
    publicId: image.publicId,
    sortOrder: image.sortOrder,
    width: image.width,
    height: image.height,
  };
}

export function buildReactionSummary(
  reactions: Pick<CommunityReaction, 'kind'>[],
): ReactionSummaryDto[] {
  const counts = new Map<CommunityReactionKind, number>();
  for (const reaction of reactions) {
    counts.set(reaction.kind, (counts.get(reaction.kind) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);
}

export function toPostDto(input: {
  post: CommunityPost & {
    author: UserPick;
    referencedUser: UserPick | null;
    images: CommunityPostImage[];
    reactions: Pick<CommunityReaction, 'kind' | 'userId'>[];
    _count?: { comments: number };
  };
  communitySlug: string;
  viewerUserId: string | null;
}): CommunityPostDto {
  const { post, communitySlug, viewerUserId } = input;
  const viewerReaction =
    viewerUserId != null
      ? (post.reactions.find((r: ReactionPick) => r.userId === viewerUserId)?.kind ?? null)
      : null;

  return {
    id: post.id,
    communitySlug,
    bodyText: post.bodyText,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    rejectReason: post.rejectReason,
    shareToken: post.shareToken,
    author: toAuthor(post.author),
    referencedUser: post.referencedUser ? toAuthor(post.referencedUser) : null,
    images: post.images.map(toPostImageDto).sort((a, b) => a.sortOrder - b.sortOrder),
    reactionSummary: buildReactionSummary(post.reactions),
    viewerReaction,
    commentCount: input.post._count?.comments ?? 0,
    createdAt: post.createdAt.toISOString(),
    scheduledPublishAt: post.scheduledPublishAt?.toISOString() ?? null,
  };
}

export function toCommentDto(input: {
  comment: CommunityComment & {
    author: UserPick;
    reactions: Pick<CommunityReaction, 'kind' | 'userId'>[];
    _count?: { threadReplies: number };
  };
  viewerUserId: string | null;
  postAuthorId: string;
  viewerRole: CommunityMemberRoleDto | null;
}): CommunityCommentDto {
  const { comment, viewerUserId, postAuthorId, viewerRole } = input;
  const viewerReaction =
    viewerUserId != null
      ? (comment.reactions.find((r: ReactionPick) => r.userId === viewerUserId)?.kind ?? null)
      : null;

  const isHidden = comment.hiddenAt != null;
  const canViewHidden =
    viewerUserId != null &&
    canViewHiddenCommunityComment({
      viewerUserId,
      commentAuthorId: comment.authorUserId,
      postAuthorId,
      role: viewerRole,
    });
  const viewerActions =
    viewerUserId != null
      ? buildCommunityCommentViewerActions({
          viewerUserId,
          commentAuthorId: comment.authorUserId,
          postAuthorId,
          role: viewerRole,
          hiddenAt: comment.hiddenAt,
          pinnedRank: comment.pinnedRank,
          deletedAt: comment.deletedAt,
        })
      : {
          canEdit: false,
          canDelete: false,
          canHide: false,
          canUnhide: false,
          canPin: false,
          canUnpin: false,
        };

  return {
    id: comment.id,
    postId: comment.postId,
    parentCommentId: comment.parentCommentId,
    bodyText: isHidden && !canViewHidden ? HIDDEN_COMMUNITY_COMMENT_PLACEHOLDER : comment.bodyText,
    author: toAuthor(comment.author),
    reactionSummary: buildReactionSummary(comment.reactions),
    viewerReaction,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    editedAt: comment.editedAt?.toISOString() ?? null,
    isHidden: isHidden && !canViewHidden,
    pinnedRank: comment.pinnedRank,
    replyCount: comment.parentCommentId == null ? (comment._count?.threadReplies ?? 0) : 0,
    viewerActions,
  };
}

export function toPostShareDto(input: {
  post: CommunityPost & {
    author: UserPick;
    images: CommunityPostImage[];
    community: Pick<PrismaCommunity, 'name' | 'slug'>;
  };
}): CommunityPostShareDto {
  const { post } = input;
  const excerpt =
    post.bodyText != null && post.bodyText.length > 0 ? post.bodyText.slice(0, 280) : null;
  const firstImage = [...post.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];

  return {
    shareToken: post.shareToken,
    communityName: post.community.name,
    communitySlug: post.community.slug,
    authorUsername: post.author.username,
    excerpt,
    imageUrl: firstImage?.url ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };
}
