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
  CommunityPostDto,
  CommunityPostImageDto,
  CommunityPostShareDto,
  ReactionSummaryDto,
} from '@soulsync/shared-types/communities';

type UserPick = Pick<User, 'id' | 'username' | 'avatarUrl'>;

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

export function toCommunityDto(
  community: PrismaCommunity,
  viewerMembership: CommunityMember | null,
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
  };
}

export function toMemberDto(
  member: CommunityMember & { user: UserPick },
): CommunityMemberDto {
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
      ? (post.reactions.find((r) => r.userId === viewerUserId)?.kind ?? null)
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
  };
}

export function toCommentDto(input: {
  comment: CommunityComment & { author: UserPick; reactions: Pick<CommunityReaction, 'kind' | 'userId'>[] };
  viewerUserId: string | null;
}): CommunityCommentDto {
  const { comment, viewerUserId } = input;
  const viewerReaction =
    viewerUserId != null
      ? (comment.reactions.find((r) => r.userId === viewerUserId)?.kind ?? null)
      : null;

  return {
    id: comment.id,
    postId: comment.postId,
    parentCommentId: comment.parentCommentId,
    bodyText: comment.bodyText,
    author: toAuthor(comment.author),
    reactionSummary: buildReactionSummary(comment.reactions),
    viewerReaction,
    createdAt: comment.createdAt.toISOString(),
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
    post.bodyText != null && post.bodyText.length > 0
      ? post.bodyText.slice(0, 280)
      : null;
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
