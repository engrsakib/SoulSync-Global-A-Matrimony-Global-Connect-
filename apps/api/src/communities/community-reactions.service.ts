import { Injectable, NotFoundException } from '@nestjs/common';
import { CommunityPostStatus } from '@soulsync/db';
import type { SetCommunityReactionDto } from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';
import { ActivityLogRecorder } from '../activity-log/activity-log.recorder';
import { CommunityPostEngagementService } from './community-post-engagement.service';
import { communityActivityUserSelect } from './community-activity-user.select';

@Injectable()
export class CommunityReactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CommunityAccessService,
    private readonly engagement: CommunityPostEngagementService,
    private readonly activityLog: ActivityLogRecorder,
  ) {}

  async setPostReaction(
    userId: string,
    slug: string,
    postId: string,
    body: SetCommunityReactionDto,
  ): Promise<void> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    this.access.assertActiveMember(await this.access.getMembership(community.id, userId));

    const post = await this.prisma.client.communityPost.findFirst({
      where: {
        id: postId,
        communityId: community.id,
        deletedAt: null,
        status: CommunityPostStatus.PUBLISHED,
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prisma.client.communityReaction.findUnique({
      where: { userId_postId: { userId, postId: post.id } },
    });

    await this.prisma.client.communityReaction.upsert({
      where: { userId_postId: { userId, postId: post.id } },
      create: { userId, postId: post.id, kind: body.kind },
      update: { kind: body.kind },
    });

    if (!existing) {
      await this.engagement.incrementReactions(post.id, 1);
      await this.recordNewReaction({
        tenantId: user.tenantId,
        targetAuthorUserId: post.authorUserId,
        reactorUserId: userId,
        communitySlug: slug,
        postId: post.id,
        kind: body.kind,
      });
    }
  }

  async clearPostReaction(userId: string, slug: string, postId: string): Promise<void> {
    const post = await this.ensurePostReactionContext(userId, slug, postId);
    const result = await this.prisma.client.communityReaction.deleteMany({
      where: { userId, postId: post.id },
    });
    if (result.count > 0) {
      await this.engagement.incrementReactions(post.id, -1);
    }
  }

  async setCommentReaction(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
    body: SetCommunityReactionDto,
  ): Promise<void> {
    await this.ensurePostReactionContext(userId, slug, postId);

    const comment = await this.prisma.client.communityComment.findFirst({
      where: { id: commentId, postId, deletedAt: null },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existing = await this.prisma.client.communityReaction.findUnique({
      where: { userId_commentId: { userId, commentId: comment.id } },
    });

    await this.prisma.client.communityReaction.upsert({
      where: { userId_commentId: { userId, commentId: comment.id } },
      create: { userId, commentId: comment.id, kind: body.kind },
      update: { kind: body.kind },
    });

    if (!existing) {
      const user = await this.access.requireTenantUser(userId);
      await this.recordNewReaction({
        tenantId: user.tenantId,
        targetAuthorUserId: comment.authorUserId,
        reactorUserId: userId,
        communitySlug: slug,
        postId,
        commentId: comment.id,
        kind: body.kind,
      });
    }
  }

  async clearCommentReaction(
    userId: string,
    slug: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    await this.ensurePostReactionContext(userId, slug, postId);
    await this.prisma.client.communityReaction.deleteMany({
      where: { userId, commentId },
    });
  }

  private async ensurePostReactionContext(userId: string, slug: string, postId: string) {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    this.access.assertActiveMember(await this.access.getMembership(community.id, userId));

    const post = await this.prisma.client.communityPost.findFirst({
      where: {
        id: postId,
        communityId: community.id,
        deletedAt: null,
        status: CommunityPostStatus.PUBLISHED,
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  private async recordNewReaction(input: {
    tenantId: string;
    targetAuthorUserId: string;
    reactorUserId: string;
    communitySlug: string;
    postId: string;
    commentId?: string;
    kind: string;
  }): Promise<void> {
    const [targetAuthor, reactor] = await Promise.all([
      this.prisma.client.user.findUnique({
        where: { id: input.targetAuthorUserId },
        select: communityActivityUserSelect,
      }),
      this.prisma.client.user.findUnique({
        where: { id: input.reactorUserId },
        select: communityActivityUserSelect,
      }),
    ]);
    if (!targetAuthor || !reactor) {
      return;
    }
    this.activityLog.communityReactionAdded({
      tenantId: input.tenantId,
      targetAuthor,
      reactor,
      communitySlug: input.communitySlug,
      postId: input.postId,
      commentId: input.commentId,
      kind: input.kind,
    });
  }
}
