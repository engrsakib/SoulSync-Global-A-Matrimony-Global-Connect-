import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommunityMemberStatus,
  CommunityPostApprovalMode,
  CommunityPostStatus,
  CommunityPrivacy,
} from '@soulsync/db';
import type {
  CommunityFeedDto,
  CommunityPostDto,
  CommunityPostShareDto,
  CreateCommunityPostDto,
  DecideCommunityPostDto,
  PatchCommunityPostDto,
} from '@soulsync/shared-types/communities';
import { canModerateCommunity } from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';
import { toPostDto, toPostShareDto } from './community.mapper';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const postInclude = {
  author: { select: { id: true, username: true, avatarUrl: true } },
  referencedUser: { select: { id: true, username: true, avatarUrl: true } },
  images: true,
  reactions: { select: { kind: true, userId: true } },
  _count: { select: { comments: true } },
} as const;

@Injectable()
export class CommunityPostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CommunityAccessService,
  ) {}

  async listFeed(
    userId: string,
    slug: string,
    options: {
      cursor?: string;
      limit?: number;
      includePending?: boolean;
      authorUserId?: string;
      publishedOnly?: boolean;
      moderationQueue?: boolean;
    } = {},
  ): Promise<CommunityFeedDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = await this.access.getMembership(community.id, userId);
    const isMod =
      membership != null &&
      membership.status === CommunityMemberStatus.ACTIVE &&
      canModerateCommunity(membership.role);

    if (!membership || membership.status !== CommunityMemberStatus.ACTIVE) {
      throw new ForbiddenException('You must be an active member to view the feed');
    }

    if (options.moderationQueue) {
      if (!isMod) {
        throw new ForbiddenException('Moderator access required');
      }
      return this.listModerationQueue(community.id, slug, userId, options.cursor, options.limit);
    }

    const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const parsedCursor = parseFeedCursor(options.cursor);

    const statusFilter: CommunityPostStatus[] = [CommunityPostStatus.PUBLISHED];
    if (options.publishedOnly) {
      statusFilter.splice(0, statusFilter.length, CommunityPostStatus.PUBLISHED);
    }

    const rows = await this.prisma.client.communityPost.findMany({
      where: {
        communityId: community.id,
        deletedAt: null,
        status: { in: statusFilter },
        ...(options.authorUserId ? { authorUserId: options.authorUserId } : {}),
        ...(parsedCursor
          ? {
              OR: [
                { publishedAt: { lt: parsedCursor.publishedAt } },
                {
                  publishedAt: parsedCursor.publishedAt,
                  id: { lt: parsedCursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: postInclude,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last?.publishedAt
        ? encodeFeedCursor({ publishedAt: last.publishedAt, id: last.id })
        : null;

    let pendingCount: number | null = null;
    if (isMod) {
      pendingCount = await this.prisma.client.communityPost.count({
        where: {
          communityId: community.id,
          deletedAt: null,
          status: CommunityPostStatus.PENDING,
        },
      });
    }

    return {
      items: page.map((post) =>
        toPostDto({ post, communitySlug: slug, viewerUserId: userId }),
      ),
      nextCursor,
      pendingCount,
    };
  }

  async createPost(
    userId: string,
    slug: string,
    body: CreateCommunityPostDto,
  ): Promise<CommunityPostDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );

    const text = body.bodyText?.trim() ?? '';
    const images = body.images ?? [];
    if (!text && images.length === 0) {
      throw new BadRequestException('Post must include text or at least one image');
    }

    if (body.referencedUserId) {
      const refMember = await this.access.getMembership(community.id, body.referencedUserId);
      if (!refMember || refMember.status !== CommunityMemberStatus.ACTIVE) {
        throw new BadRequestException('Referenced user is not an active member');
      }
    }

    const { status, publishedAt } = this.resolveInitialPostStatus(
      community.postApprovalMode,
      membership.isTrustedPoster,
    );

    const post = await this.prisma.client.communityPost.create({
      data: {
        communityId: community.id,
        authorUserId: userId,
        tenantId: user.tenantId,
        bodyText: text || null,
        status,
        publishedAt,
        referencedUserId: body.referencedUserId ?? null,
        images: {
          create: images.map((img, index) => ({
            url: img.url,
            publicId: img.publicId ?? null,
            sortOrder: img.sortOrder ?? index,
            width: img.width ?? null,
            height: img.height ?? null,
          })),
        },
      },
      include: postInclude,
    });

    return toPostDto({ post, communitySlug: slug, viewerUserId: userId });
  }

  async decidePost(
    userId: string,
    slug: string,
    postId: string,
    body: DecideCommunityPostDto,
  ): Promise<CommunityPostDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );
    if (!canModerateCommunity(membership.role)) {
      throw new ForbiddenException('Moderator access required');
    }

    const post = await this.prisma.client.communityPost.findFirst({
      where: { id: postId, communityId: community.id, deletedAt: null },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.status !== CommunityPostStatus.PENDING) {
      throw new BadRequestException('Post is not pending review');
    }

    const now = new Date();
    const updated = await this.prisma.client.communityPost.update({
      where: { id: post.id },
      data:
        body.decision === 'approve'
          ? {
              status: CommunityPostStatus.PUBLISHED,
              publishedAt: now,
              reviewedByUserId: userId,
              reviewedAt: now,
              rejectReason: null,
            }
          : {
              status: CommunityPostStatus.REJECTED,
              reviewedByUserId: userId,
              reviewedAt: now,
              rejectReason: body.rejectReason?.trim() || 'Rejected by moderator',
            },
      include: postInclude,
    });

    return toPostDto({ post: updated, communitySlug: slug, viewerUserId: userId });
  }

  async patchPost(
    userId: string,
    slug: string,
    postId: string,
    body: PatchCommunityPostDto,
  ): Promise<CommunityPostDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = await this.access.getMembership(community.id, userId);
    if (!membership || membership.status !== CommunityMemberStatus.ACTIVE) {
      throw new ForbiddenException('Active membership required');
    }

    const post = await this.prisma.client.communityPost.findFirst({
      where: { id: postId, communityId: community.id, deletedAt: null },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isAuthor = post.authorUserId === userId;
    const isMod = canModerateCommunity(membership.role);
    if (!isAuthor && !isMod) {
      throw new ForbiddenException('Cannot edit this post');
    }

    const updated = await this.prisma.client.communityPost.update({
      where: { id: post.id },
      data: {
        bodyText: body.bodyText !== undefined ? body.bodyText?.trim() || null : undefined,
      },
      include: postInclude,
    });

    return toPostDto({ post: updated, communitySlug: slug, viewerUserId: userId });
  }

  async deletePost(userId: string, slug: string, postId: string): Promise<CommunityPostDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = await this.access.getMembership(community.id, userId);
    if (!membership || membership.status !== CommunityMemberStatus.ACTIVE) {
      throw new ForbiddenException('Active membership required');
    }

    const post = await this.prisma.client.communityPost.findFirst({
      where: { id: postId, communityId: community.id, deletedAt: null },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isAuthor = post.authorUserId === userId;
    const isMod = canModerateCommunity(membership.role);
    if (!isAuthor && !isMod) {
      throw new ForbiddenException('Cannot delete this post');
    }

    const updated = await this.prisma.client.communityPost.update({
      where: { id: post.id },
      data: { deletedAt: new Date(), deletedByUserId: userId },
      include: postInclude,
    });

    return toPostDto({ post: updated, communitySlug: slug, viewerUserId: userId });
  }

  async getPublicShare(shareToken: string): Promise<CommunityPostShareDto> {
    const post = await this.prisma.client.communityPost.findFirst({
      where: {
        shareToken,
        deletedAt: null,
        status: CommunityPostStatus.PUBLISHED,
        community: {
          deletedAt: null,
          privacy: CommunityPrivacy.PUBLIC,
        },
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        images: true,
        community: { select: { name: true, slug: true } },
      },
    });
    if (!post) {
      throw new NotFoundException('Shared post not found');
    }
    return toPostShareDto({ post });
  }

  private async listModerationQueue(
    communityId: string,
    slug: string,
    viewerUserId: string,
    cursor?: string,
    limitInput?: number,
  ): Promise<CommunityFeedDto> {
    const limit = Math.min(Math.max(limitInput ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const parsedCursor = parseModerationCursor(cursor);

    const rows = await this.prisma.client.communityPost.findMany({
      where: {
        communityId,
        deletedAt: null,
        status: CommunityPostStatus.PENDING,
        ...(parsedCursor
          ? {
              OR: [
                { createdAt: { lt: parsedCursor.createdAt } },
                { createdAt: parsedCursor.createdAt, id: { lt: parsedCursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: postInclude,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeModerationCursor({ createdAt: last.createdAt, id: last.id })
        : null;

    const pendingCount = await this.prisma.client.communityPost.count({
      where: { communityId, deletedAt: null, status: CommunityPostStatus.PENDING },
    });

    return {
      items: page.map((post) =>
        toPostDto({ post, communitySlug: slug, viewerUserId }),
      ),
      nextCursor,
      pendingCount,
    };
  }

  private resolveInitialPostStatus(
    mode: CommunityPostApprovalMode,
    isTrustedPoster: boolean,
  ): { status: CommunityPostStatus; publishedAt: Date | null } {
    const now = new Date();
    switch (mode) {
      case CommunityPostApprovalMode.AUTO_APPROVE:
        return { status: CommunityPostStatus.PUBLISHED, publishedAt: now };
      case CommunityPostApprovalMode.ALL_PENDING:
        return { status: CommunityPostStatus.PENDING, publishedAt: null };
      case CommunityPostApprovalMode.TRUSTED_AUTO_REST_PENDING:
        if (isTrustedPoster) {
          return { status: CommunityPostStatus.PUBLISHED, publishedAt: now };
        }
        return { status: CommunityPostStatus.PENDING, publishedAt: null };
      default:
        return { status: CommunityPostStatus.PENDING, publishedAt: null };
    }
  }
}

type FeedCursor = { publishedAt: Date; id: string };

function encodeFeedCursor(cursor: FeedCursor): string {
  return Buffer.from(
    JSON.stringify({ p: cursor.publishedAt.toISOString(), i: cursor.id }),
    'utf8',
  ).toString('base64url');
}

type ModerationCursor = { createdAt: Date; id: string };

function encodeModerationCursor(cursor: ModerationCursor): string {
  return Buffer.from(
    JSON.stringify({ c: cursor.createdAt.toISOString(), i: cursor.id }),
    'utf8',
  ).toString('base64url');
}

function parseModerationCursor(raw: string | undefined): ModerationCursor | null {
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

function parseFeedCursor(raw: string | undefined): FeedCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      p?: string;
      i?: string;
    };
    if (!parsed.p || !parsed.i) {
      return null;
    }
    const publishedAt = new Date(parsed.p);
    if (Number.isNaN(publishedAt.getTime())) {
      return null;
    }
    return { publishedAt, id: parsed.i };
  } catch {
    return null;
  }
}
