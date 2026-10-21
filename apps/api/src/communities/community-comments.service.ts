import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommunityPostStatus } from '@soulsync/db';
import type {
  CommunityCommentDto,
  CreateCommunityCommentDto,
} from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';
import { toCommentDto } from './community.mapper';

const DEFAULT_LIMIT = 50;

@Injectable()
export class CommunityCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CommunityAccessService,
  ) {}

  async listComments(
    userId: string,
    slug: string,
    postId: string,
    cursor?: string,
  ): Promise<{ items: CommunityCommentDto[]; nextCursor: string | null }> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    this.access.assertActiveMember(await this.access.getMembership(community.id, userId));

    const post = await this.requireVisiblePost(community.id, postId);

    const parsedCursor = parseCommentCursor(cursor);
    const limit = DEFAULT_LIMIT;

    const rows = await this.prisma.client.communityComment.findMany({
      where: {
        postId: post.id,
        deletedAt: null,
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
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        reactions: { select: { kind: true, userId: true } },
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCommentCursor({ createdAt: last.createdAt, id: last.id })
        : null;

    return {
      items: page.map((comment) => toCommentDto({ comment, viewerUserId: userId })),
      nextCursor,
    };
  }

  async createComment(
    userId: string,
    slug: string,
    postId: string,
    body: CreateCommunityCommentDto,
  ): Promise<CommunityCommentDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    this.access.assertActiveMember(await this.access.getMembership(community.id, userId));

    const post = await this.requireVisiblePost(community.id, postId);
    const text = body.bodyText?.trim();
    if (!text) {
      throw new BadRequestException('Comment text is required');
    }

    if (body.parentCommentId) {
      const parent = await this.prisma.client.communityComment.findFirst({
        where: { id: body.parentCommentId, postId: post.id, deletedAt: null },
      });
      if (!parent) {
        throw new BadRequestException('Parent comment not found');
      }
    }

    const comment = await this.prisma.client.communityComment.create({
      data: {
        postId: post.id,
        authorUserId: userId,
        parentCommentId: body.parentCommentId ?? null,
        bodyText: text,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        reactions: { select: { kind: true, userId: true } },
      },
    });

    return toCommentDto({ comment, viewerUserId: userId });
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
