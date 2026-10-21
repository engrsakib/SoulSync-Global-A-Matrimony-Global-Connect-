import { Injectable, NotFoundException } from '@nestjs/common';
import { CommunityPostStatus } from '@soulsync/db';
import type { SetCommunityReactionDto } from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';

@Injectable()
export class CommunityReactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CommunityAccessService,
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

    await this.prisma.client.communityReaction.upsert({
      where: { userId_postId: { userId, postId: post.id } },
      create: { userId, postId: post.id, kind: body.kind },
      update: { kind: body.kind },
    });
  }

  async clearPostReaction(userId: string, slug: string, postId: string): Promise<void> {
    await this.ensurePostReactionContext(userId, slug, postId);
    await this.prisma.client.communityReaction.deleteMany({
      where: { userId, postId },
    });
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

    await this.prisma.client.communityReaction.upsert({
      where: { userId_commentId: { userId, commentId: comment.id } },
      create: { userId, commentId: comment.id, kind: body.kind },
      update: { kind: body.kind },
    });
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
}
