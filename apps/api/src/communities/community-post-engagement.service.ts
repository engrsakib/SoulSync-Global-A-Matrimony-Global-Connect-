import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeHotScore } from './feed-ranking.util';

@Injectable()
export class CommunityPostEngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async incrementReactions(postId: string, delta: number): Promise<void> {
    if (delta === 0) {
      return;
    }
    await this.adjustCounter(postId, 'reactionsCount', delta);
  }

  async incrementComments(postId: string, delta: number): Promise<void> {
    if (delta === 0) {
      return;
    }
    await this.adjustCounter(postId, 'commentsCount', delta);
  }

  async incrementShares(postId: string): Promise<{ sharesCount: number }> {
    const post = await this.prisma.client.communityPost.update({
      where: { id: postId },
      data: { sharesCount: { increment: 1 } },
      select: {
        id: true,
        reactionsCount: true,
        commentsCount: true,
        sharesCount: true,
        publishedAt: true,
        createdAt: true,
      },
    });
    await this.recomputeHotScoreForRow(post);
    return { sharesCount: post.sharesCount };
  }

  async recomputeHotScore(postId: string): Promise<void> {
    const post = await this.prisma.client.communityPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        reactionsCount: true,
        commentsCount: true,
        sharesCount: true,
        publishedAt: true,
        createdAt: true,
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    await this.recomputeHotScoreForRow(post);
  }

  private async adjustCounter(
    postId: string,
    field: 'reactionsCount' | 'commentsCount',
    delta: number,
  ): Promise<void> {
    const post = await this.prisma.client.communityPost.update({
      where: { id: postId },
      data: { [field]: { increment: delta } },
      select: {
        id: true,
        reactionsCount: true,
        commentsCount: true,
        sharesCount: true,
        publishedAt: true,
        createdAt: true,
      },
    });
    const counts = {
      reactionsCount: Math.max(0, post.reactionsCount),
      commentsCount: Math.max(0, post.commentsCount),
      sharesCount: Math.max(0, post.sharesCount),
    };
    if (
      counts.reactionsCount !== post.reactionsCount ||
      counts.commentsCount !== post.commentsCount
    ) {
      await this.prisma.client.communityPost.update({
        where: { id: postId },
        data: counts,
      });
    }
    await this.recomputeHotScoreForRow({ ...post, ...counts });
  }

  private async recomputeHotScoreForRow(post: {
    id: string;
    reactionsCount: number;
    commentsCount: number;
    sharesCount: number;
    publishedAt: Date | null;
    createdAt: Date;
  }): Promise<void> {
    const anchor = post.publishedAt ?? post.createdAt;
    const hotScore = computeHotScore(
      {
        reactionsCount: post.reactionsCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
      },
      anchor,
    );
    await this.prisma.client.communityPost.update({
      where: { id: post.id },
      data: { hotScore, hotScoreUpdatedAt: new Date() },
    });
  }
}
