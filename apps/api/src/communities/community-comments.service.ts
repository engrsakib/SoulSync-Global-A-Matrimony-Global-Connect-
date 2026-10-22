import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommunityPostStatus } from '@soulsync/db';
import type {
  CommunityCommentDto,
  CreateCommunityCommentDto,
  PatchCommunityCommentDto,
  PinCommunityCommentDto,
} from '@soulsync/shared-types/communities';
import {
  MAX_PINNED_COMMENTS_PER_POST,
  canDeleteCommunityComment,
  canEditCommunityComment,
  canHideCommunityComment,
  canPinCommunityComment,
  canUnhideCommunityComment,
  canUnpinCommunityComment,
} from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';
import { CommunityMentionsService } from './community-mentions.service';
import { CommunityPostEngagementService } from './community-post-engagement.service';
import { toCommentDto } from './community.mapper';

const DEFAULT_LIMIT = 50;

const commentInclude = {
  author: { select: { id: true, username: true, avatarUrl: true } },
  reactions: { select: { kind: true, userId: true } },
  _count: {
    select: {
      threadReplies: { where: { deletedAt: null } },
    },
  },
} as const;

@Injectable()
export class CommunityCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CommunityAccessService,
    private readonly mentions: CommunityMentionsService,
    private readonly engagement: CommunityPostEngagementService,
  ) {}

  async listComments(
    userId: string,
    slug: string,
    postId: string,
    cursor?: string,
  ): Promise<{ items: CommunityCommentDto[]; nextCursor: string | null }> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );

    const post = await this.requireVisiblePost(community.id, postId);
    const parsedCursor = parseCommentCursor(cursor);
    const limit = DEFAULT_LIMIT;
    const viewerRole = membership.role;

    const pinned =
      parsedCursor === null
        ? await this.prisma.client.communityComment.findMany({
            where: {
              postId: post.id,
              deletedAt: null,
              parentCommentId: null,
              pinnedRank: { not: null },
            },
            orderBy: { pinnedRank: 'asc' },
            include: commentInclude,
          })
        : [];

    const unpinnedRows = await this.prisma.client.communityComment.findMany({
      where: {
        postId: post.id,
        deletedAt: null,
        parentCommentId: null,
        pinnedRank: null,
        ...(parsedCursor
          ? {
              OR: [
                { createdAt: { gt: parsedCursor.createdAt } },
                { createdAt: parsedCursor.createdAt, id: { gt: parsedCursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      include: commentInclude,
    });

    const hasMore = unpinnedRows.length > limit;
    const unpinnedPage = hasMore ? unpinnedRows.slice(0, limit) : unpinnedRows;
    const last = unpinnedPage[unpinnedPage.length - 1];
    const nextCursor =
      hasMore && last ? encodeCommentCursor({ createdAt: last.createdAt, id: last.id }) : null;

    const page = [...pinned, ...unpinnedPage];
    return {
      items: page.map((comment) =>
        toCommentDto({
          comment,
          viewerUserId: userId,
          postAuthorId: post.authorUserId,
          viewerRole,
        }),
      ),
      nextCursor,
    };
  }

  async listCommentReplies(
    userId: string,
    slug: string,
    postId: string,
    threadRootCommentId: string,
  ): Promise<CommunityCommentDto[]> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );

    const post = await this.requireVisiblePost(community.id, postId);
    const root = await this.prisma.client.communityComment.findFirst({
      where: {
        id: threadRootCommentId,
        postId: post.id,
        deletedAt: null,
        parentCommentId: null,
      },
    });
    if (!root) {
      throw new NotFoundException('Comment thread not found');
    }

    const rows = await this.prisma.client.communityComment.findMany({
      where: {
        postId: post.id,
        deletedAt: null,
        threadRootCommentId: root.id,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: commentInclude,
    });

    return rows.map((comment) =>
      toCommentDto({
        comment,
        viewerUserId: userId,
        postAuthorId: post.authorUserId,
        viewerRole: membership.role,
      }),
    );
  }

  async createComment(
    userId: string,
    slug: string,
    postId: string,
    body: CreateCommunityCommentDto,
  ): Promise<CommunityCommentDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );

    const post = await this.requireVisiblePost(community.id, postId);
    const text = body.bodyText?.trim();
    if (!text) {
      throw new BadRequestException('Comment text is required');
    }

    await this.mentions.assertMentionsInCommunity(community.id, text);

    let threadRootCommentId: string | null = null;
    if (body.parentCommentId) {
      const parent = await this.prisma.client.communityComment.findFirst({
        where: { id: body.parentCommentId, postId: post.id, deletedAt: null },
      });
      if (!parent) {
        throw new BadRequestException('Parent comment not found');
      }
      if (parent.hiddenAt) {
        throw new BadRequestException('Cannot reply to a hidden comment');
      }
      threadRootCommentId = parent.threadRootCommentId ?? parent.id;
    }

    const comment = await this.prisma.client.communityComment.create({
      data: {
        postId: post.id,
        authorUserId: userId,
        parentCommentId: body.parentCommentId ?? null,
        threadRootCommentId,
        bodyText: text,
      },
      include: commentInclude,
    });

    await this.mentions.notifyCommentMentions({
      communityId: community.id,
      tenantId: user.tenantId,
      communitySlug: slug,
      postId: post.id,
      commentId: comment.id,
      actorUserId: userId,
      actorUsername: user.username,
      bodyText: text,
    });

    await this.engagement.incrementComments(post.id, 1);

    return toCommentDto({
      comment,
      viewerUserId: userId,
      postAuthorId: post.authorUserId,
      viewerRole: membership.role,
    });
  }

  async patchComment(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
    body: PatchCommunityCommentDto,
  ): Promise<CommunityCommentDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );

    const post = await this.requireVisiblePost(community.id, postId);
    const existing = await this.requireComment(post.id, commentId);

    if (
      !canEditCommunityComment({
        viewerUserId: userId,
        commentAuthorId: existing.authorUserId,
        deletedAt: existing.deletedAt?.toISOString(),
      })
    ) {
      throw new ForbiddenException('Cannot edit this comment');
    }

    const text = body.bodyText?.trim();
    if (!text) {
      throw new BadRequestException('Comment text is required');
    }

    await this.mentions.assertMentionsInCommunity(community.id, text);

    const previousBody = existing.bodyText;
    const comment = await this.prisma.client.communityComment.update({
      where: { id: existing.id },
      data: {
        bodyText: text,
        editedAt: text !== previousBody ? new Date() : existing.editedAt,
      },
      include: commentInclude,
    });

    await this.mentions.notifyCommentMentions({
      communityId: community.id,
      tenantId: user.tenantId,
      communitySlug: slug,
      postId: post.id,
      commentId: comment.id,
      actorUserId: userId,
      actorUsername: user.username,
      bodyText: text,
      previousBodyText: previousBody,
    });

    return toCommentDto({
      comment,
      viewerUserId: userId,
      postAuthorId: post.authorUserId,
      viewerRole: membership.role,
    });
  }

  async deleteComment(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
  ): Promise<CommunityCommentDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );

    const post = await this.requireVisiblePost(community.id, postId);
    const existing = await this.requireComment(post.id, commentId);

    if (
      !canDeleteCommunityComment({
        viewerUserId: userId,
        commentAuthorId: existing.authorUserId,
        postAuthorId: post.authorUserId,
        role: membership.role,
        deletedAt: existing.deletedAt?.toISOString(),
      })
    ) {
      throw new ForbiddenException('Cannot delete this comment');
    }

    const comment = await this.prisma.client.communityComment.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), pinnedRank: null },
      include: commentInclude,
    });

    if (!existing.deletedAt) {
      await this.engagement.incrementComments(post.id, -1);
    }

    return toCommentDto({
      comment,
      viewerUserId: userId,
      postAuthorId: post.authorUserId,
      viewerRole: membership.role,
    });
  }

  async hideComment(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
  ): Promise<CommunityCommentDto> {
    return this.setHidden(userId, slug, postId, commentId, true);
  }

  async unhideComment(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
  ): Promise<CommunityCommentDto> {
    return this.setHidden(userId, slug, postId, commentId, false);
  }

  async pinComment(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
    body: PinCommunityCommentDto,
  ): Promise<CommunityCommentDto> {
    if (body.pinned) {
      return this.pin(userId, slug, postId, commentId);
    }
    return this.unpin(userId, slug, postId, commentId);
  }

  private async setHidden(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
    hidden: boolean,
  ): Promise<CommunityCommentDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );

    const post = await this.requireVisiblePost(community.id, postId);
    const existing = await this.requireComment(post.id, commentId);
    const role = membership.role;
    const ctx = {
      viewerUserId: userId,
      postAuthorId: post.authorUserId,
      role,
      hiddenAt: existing.hiddenAt?.toISOString(),
      deletedAt: existing.deletedAt?.toISOString(),
    };

    if (hidden) {
      if (!canHideCommunityComment(ctx)) {
        throw new ForbiddenException('Cannot hide this comment');
      }
    } else if (!canUnhideCommunityComment(ctx)) {
      throw new ForbiddenException('Cannot unhide this comment');
    }

    const comment = await this.prisma.client.communityComment.update({
      where: { id: existing.id },
      data: { hiddenAt: hidden ? new Date() : null },
      include: commentInclude,
    });

    return toCommentDto({
      comment,
      viewerUserId: userId,
      postAuthorId: post.authorUserId,
      viewerRole: role,
    });
  }

  private async pin(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
  ): Promise<CommunityCommentDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );

    const post = await this.requireVisiblePost(community.id, postId);
    const existing = await this.requireComment(post.id, commentId);
    const role = membership.role;

    if (existing.parentCommentId) {
      throw new BadRequestException('Only top-level comments can be pinned');
    }

    if (
      !canPinCommunityComment({
        viewerUserId: userId,
        postAuthorId: post.authorUserId,
        role,
        pinnedRank: existing.pinnedRank,
        deletedAt: existing.deletedAt?.toISOString(),
        hiddenAt: existing.hiddenAt?.toISOString(),
      })
    ) {
      throw new ForbiddenException('Cannot pin this comment');
    }

    const comment = await this.prisma.client.$transaction(async (tx) => {
      const pinned = await tx.communityComment.findMany({
        where: {
          postId: post.id,
          deletedAt: null,
          parentCommentId: null,
          pinnedRank: { not: null },
        },
        select: { pinnedRank: true },
      });
      if (pinned.length >= MAX_PINNED_COMMENTS_PER_POST) {
        throw new BadRequestException(
          `At most ${MAX_PINNED_COMMENTS_PER_POST} comments can be pinned on a post`,
        );
      }
      const used = new Set(
        pinned.map((row) => row.pinnedRank).filter((r): r is number => r != null),
      );
      let rank = 1;
      while (used.has(rank) && rank <= MAX_PINNED_COMMENTS_PER_POST) {
        rank += 1;
      }
      if (rank > MAX_PINNED_COMMENTS_PER_POST) {
        throw new BadRequestException(
          `At most ${MAX_PINNED_COMMENTS_PER_POST} comments can be pinned on a post`,
        );
      }
      return tx.communityComment.update({
        where: { id: existing.id },
        data: { pinnedRank: rank },
        include: commentInclude,
      });
    });

    return toCommentDto({
      comment,
      viewerUserId: userId,
      postAuthorId: post.authorUserId,
      viewerRole: role,
    });
  }

  private async unpin(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
  ): Promise<CommunityCommentDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );

    const post = await this.requireVisiblePost(community.id, postId);
    const existing = await this.requireComment(post.id, commentId);
    const role = membership.role;

    if (
      !canUnpinCommunityComment({
        viewerUserId: userId,
        postAuthorId: post.authorUserId,
        role,
        pinnedRank: existing.pinnedRank,
        deletedAt: existing.deletedAt?.toISOString(),
      })
    ) {
      throw new ForbiddenException('Cannot unpin this comment');
    }

    const comment = await this.prisma.client.communityComment.update({
      where: { id: existing.id },
      data: { pinnedRank: null },
      include: commentInclude,
    });

    return toCommentDto({
      comment,
      viewerUserId: userId,
      postAuthorId: post.authorUserId,
      viewerRole: role,
    });
  }

  private async requireComment(postId: string, commentId: string) {
    const comment = await this.prisma.client.communityComment.findFirst({
      where: { id: commentId, postId, deletedAt: null },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  private async requireVisiblePost(communityId: string, postId: string) {
    const post = await this.prisma.client.communityPost.findFirst({
      where: {
        id: postId,
        communityId,
        deletedAt: null,
        status: CommunityPostStatus.PUBLISHED,
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }
}

type CommentCursor = { createdAt: Date; id: string };

function encodeCommentCursor(cursor: CommentCursor): string {
  return Buffer.from(
    JSON.stringify({ c: cursor.createdAt.toISOString(), i: cursor.id }),
    'utf8',
  ).toString('base64url');
}

function parseCommentCursor(raw: string | undefined): CommentCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      c?: string;
      i?: string;
    };
    if (!parsed.c || !parsed.i) {
      return null;
    }
    const createdAt = new Date(parsed.c);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }
    return { createdAt, id: parsed.i };
  } catch {
    return null;
  }
}
