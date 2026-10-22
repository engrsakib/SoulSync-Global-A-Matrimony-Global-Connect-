import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import {
  CommunityMemberStatus,
  CommunityPostApprovalMode,
  CommunityPostStatus,
  CommunityPrivacy,
} from '@soulsync/db';
import type {
  CommunityFeedDto,
  CommunityFeedSortDto,
  CommunityPostDto,
  CommunityPostShareDto,
  CommunityPostShareResultDto,
  CreateCommunityPostDto,
  DecideCommunityPostDto,
  PatchCommunityPostDto,
} from '@soulsync/shared-types/communities';
import { canModerateCommunity, isCommunityAdminRole } from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';
import { CommunityPostScheduleService } from './community-post-schedule.service';
import { CommunityMentionsService } from './community-mentions.service';
import { CommunityFeedRankingService } from './community-feed-ranking.service';
import { CommunityPostEngagementService } from './community-post-engagement.service';
import { FEED_RANKING } from './feed-ranking.config';
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
    private readonly scheduleService: CommunityPostScheduleService,
    private readonly mentions: CommunityMentionsService,
    private readonly config: ConfigService<Env, true>,
    private readonly feedRanking: CommunityFeedRankingService,
    private readonly engagement: CommunityPostEngagementService,
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
      sort?: CommunityFeedSortDto;
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

    const sort: CommunityFeedSortDto =
      options.sort ?? (options.publishedOnly || options.authorUserId ? 'recent' : 'ranked');

    if (sort === 'ranked' && !options.publishedOnly && !options.authorUserId) {
      return this.listRankedFeed({
        userId,
        slug,
        community,
        isMod,
        cursor: options.cursor,
        limit: options.limit,
      });
    }

    const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

    const statusWhere = options.publishedOnly
      ? { status: CommunityPostStatus.PUBLISHED }
      : {
          OR: [
            { status: CommunityPostStatus.PUBLISHED },
            {
              status: CommunityPostStatus.PENDING,
              authorUserId: userId,
            },
          ],
        };

    if (options.publishedOnly) {
      const parsedCursor = parseFeedCursor(options.cursor);
      const rows = await this.prisma.client.communityPost.findMany({
        where: {
          communityId: community.id,
          deletedAt: null,
          ...statusWhere,
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
        items: page.map((post) => toPostDto({ post, communitySlug: slug, viewerUserId: userId })),
        nextCursor,
        pendingCount,
        sort: 'recent',
      };
    }

    const parsedCursor = parseModerationCursor(options.cursor);
    const rows = await this.prisma.client.communityPost.findMany({
      where: {
        communityId: community.id,
        deletedAt: null,
        ...statusWhere,
        ...(options.authorUserId ? { authorUserId: options.authorUserId } : {}),
        ...(parsedCursor
          ? {
              OR: [
                { createdAt: { lt: parsedCursor.createdAt } },
                {
                  createdAt: parsedCursor.createdAt,
                  id: { lt: parsedCursor.id },
                },
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
      hasMore && last ? encodeModerationCursor({ createdAt: last.createdAt, id: last.id }) : null;

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
      items: page.map((post) => toPostDto({ post, communitySlug: slug, viewerUserId: userId })),
      nextCursor,
      pendingCount,
      sort: 'recent',
    };
  }

  async recordShare(
    userId: string,
    slug: string,
    postId: string,
  ): Promise<CommunityPostShareResultDto> {
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
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.engagement.incrementShares(post.id);
  }

  private async listRankedFeed(input: {
    userId: string;
    slug: string;
    community: { id: string; minAge: number | null; maxAge: number | null };
    isMod: boolean;
    cursor?: string;
    limit?: number;
  }): Promise<CommunityFeedDto> {
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const rankedCursor = parseRankedFeedCursor(input.cursor);
    const poolSize = limit * FEED_RANKING.candidateMultiplier;

    const pendingOwn =
      rankedCursor == null
        ? await this.prisma.client.communityPost.findMany({
            where: {
              communityId: input.community.id,
              deletedAt: null,
              authorUserId: input.userId,
              status: CommunityPostStatus.PENDING,
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            include: postInclude,
          })
        : [];

    const candidateWhere = {
      communityId: input.community.id,
      deletedAt: null,
      status: CommunityPostStatus.PUBLISHED,
      ...(rankedCursor
        ? {
            OR: [
              { hotScore: { lt: rankedCursor.hotScore } },
              { hotScore: rankedCursor.hotScore, id: { lt: rankedCursor.id } },
            ],
          }
        : {}),
    };

    const candidates = await this.prisma.client.communityPost.findMany({
      where: candidateWhere,
      orderBy: [{ hotScore: 'desc' }, { id: 'desc' }],
      take: poolSize,
      include: postInclude,
    });

    const viewerContext = await this.feedRanking.buildViewerContext(input.userId, {
      communityId: input.community.id,
    });
    const authorProfiles = await this.feedRanking.loadAuthorProfiles(
      candidates.map((post) => post.authorUserId),
    );

    const communitiesById = new Map([
      [input.community.id, { minAge: input.community.minAge, maxAge: input.community.maxAge }],
    ]);

    let ranked = this.feedRanking.rankPosts(
      candidates.map((post) => ({
        id: post.id,
        authorUserId: post.authorUserId,
        hotScore: post.hotScore,
        communityId: input.community.id,
      })),
      viewerContext,
      communitiesById,
      authorProfiles,
    );

    if (rankedCursor) {
      ranked = ranked.filter((row) => isRankedRowBeforeCursor(row, rankedCursor));
    }

    const pageRanked = ranked.slice(0, limit);
    const postById = new Map(candidates.map((post) => [post.id, post]));
    const scoreById = new Map(pageRanked.map((row) => [row.id, row.personalizedScore]));

    const items: CommunityPostDto[] = [
      ...pendingOwn.map((post) =>
        toPostDto({ post, communitySlug: input.slug, viewerUserId: input.userId }),
      ),
      ...pageRanked
        .map((row) => postById.get(row.id))
        .filter((post): post is NonNullable<typeof post> => post != null)
        .map((post) =>
          toPostDto({
            post,
            communitySlug: input.slug,
            viewerUserId: input.userId,
            rankScore: scoreById.get(post.id),
          }),
        ),
    ];

    const lastRanked = pageRanked[pageRanked.length - 1];
    const hasMoreCandidates = candidates.length >= poolSize;
    const hasMoreRanked = ranked.length > limit;
    const nextCursor =
      lastRanked && (hasMoreRanked || hasMoreCandidates)
        ? encodeRankedFeedCursor({
            personalizedScore: lastRanked.personalizedScore,
            hotScore: lastRanked.hotScore,
            id: lastRanked.id,
          })
        : null;

    let pendingCount: number | null = null;
    if (input.isMod) {
      pendingCount = await this.prisma.client.communityPost.count({
        where: {
          communityId: input.community.id,
          deletedAt: null,
          status: CommunityPostStatus.PENDING,
        },
      });
    }

    return {
      items,
      nextCursor,
      pendingCount,
      sort: 'ranked',
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

    if (text) {
      await this.mentions.assertMentionsInCommunity(community.id, text);
    }

    if (body.referencedUserId) {
      const refMember = await this.access.getMembership(community.id, body.referencedUserId);
      if (!refMember || refMember.status !== CommunityMemberStatus.ACTIVE) {
        throw new BadRequestException('Referenced user is not an active member');
      }
    }

    const scheduledAt = this.parseScheduledPublishAt(body.scheduledPublishAt);

    if (scheduledAt) {
      const post = await this.prisma.client.communityPost.create({
        data: {
          communityId: community.id,
          authorUserId: userId,
          tenantId: user.tenantId,
          bodyText: text || null,
          status: CommunityPostStatus.SCHEDULED,
          publishedAt: null,
          scheduledPublishAt: scheduledAt,
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

      const jobId = await this.scheduleService.enqueuePublish(post.id, scheduledAt);
      const updated = await this.prisma.client.communityPost.update({
        where: { id: post.id },
        data: { scheduleJobId: jobId },
        include: postInclude,
      });

      return toPostDto({ post: updated, communitySlug: slug, viewerUserId: userId });
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

    if (text && status === CommunityPostStatus.PUBLISHED) {
      await this.mentions.notifyPostMentions({
        communityId: community.id,
        tenantId: user.tenantId,
        communitySlug: slug,
        postId: post.id,
        actorUserId: userId,
        actorUsername: user.username,
        bodyText: text,
      });
    }

    return toPostDto({ post, communitySlug: slug, viewerUserId: userId });
  }

  async publishScheduledPost(postId: string): Promise<void> {
    const post = await this.prisma.client.communityPost.findUnique({
      where: { id: postId },
      include: {
        community: { select: { postApprovalMode: true, slug: true, deletedAt: true } },
      },
    });
    if (!post || post.deletedAt || post.community.deletedAt) {
      return;
    }
    if (post.status !== CommunityPostStatus.SCHEDULED) {
      return;
    }

    const membership = await this.access.getMembership(post.communityId, post.authorUserId);
    const isTrustedPoster =
      membership?.status === CommunityMemberStatus.ACTIVE && membership.isTrustedPoster;

    const { status, publishedAt } = this.resolveInitialPostStatus(
      post.community.postApprovalMode,
      isTrustedPoster,
    );

    await this.prisma.client.communityPost.update({
      where: { id: post.id },
      data: {
        status,
        publishedAt,
        scheduledPublishAt: null,
        scheduleJobId: null,
      },
    });

    if (status === CommunityPostStatus.PUBLISHED && post.bodyText?.trim()) {
      const author = await this.prisma.client.user.findUnique({
        where: { id: post.authorUserId },
        select: { username: true },
      });
      await this.mentions.notifyPostMentions({
        communityId: post.communityId,
        tenantId: post.tenantId,
        communitySlug: post.community.slug,
        postId: post.id,
        actorUserId: post.authorUserId,
        actorUsername: author?.username ?? null,
        bodyText: post.bodyText.trim(),
      });
    }
  }

  private parseScheduledPublishAt(raw: string | null | undefined): Date | null {
    if (raw == null || raw === '') {
      return null;
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid scheduled publish time');
    }
    const minMs = 60_000;
    const maxDays = this.config.get('COMMUNITY_SCHEDULE_MAX_DAYS', { infer: true });
    const maxMs = maxDays * 24 * 60 * 60 * 1000;
    const delta = date.getTime() - Date.now();
    if (delta < minMs) {
      throw new BadRequestException('Scheduled time must be at least one minute in the future');
    }
    if (delta > maxMs) {
      throw new BadRequestException(`Scheduled time cannot be more than ${maxDays} days ahead`);
    }
    return date;
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
    const isAdmin = isCommunityAdminRole(membership.role);

    if (body.status !== undefined && !isAdmin) {
      throw new ForbiddenException('Only group admins can change post visibility');
    }

    if (body.bodyText !== undefined) {
      if (!isAuthor && !isAdmin) {
        throw new ForbiddenException('Cannot edit this post');
      }
      const nextText = body.bodyText?.trim() ?? '';
      if (nextText) {
        await this.mentions.assertMentionsInCommunity(community.id, nextText);
      }
      if (
        isAuthor &&
        !isAdmin &&
        (post.status === CommunityPostStatus.SCHEDULED ||
          post.status === CommunityPostStatus.REJECTED)
      ) {
        throw new BadRequestException('This post cannot be edited');
      }
    }

    if (body.bodyText === undefined && body.status === undefined) {
      throw new BadRequestException('No changes provided');
    }

    const now = new Date();
    const data: {
      bodyText?: string | null;
      status?: CommunityPostStatus;
      publishedAt?: Date | null;
      rejectReason?: string | null;
    } = {};

    if (body.bodyText !== undefined) {
      data.bodyText = body.bodyText?.trim() || null;
    }

    if (body.status !== undefined) {
      if (
        post.status !== CommunityPostStatus.PUBLISHED &&
        post.status !== CommunityPostStatus.PENDING
      ) {
        throw new BadRequestException(
          'Visibility can only be changed for published or pending posts',
        );
      }
      if (body.status === 'PUBLISHED') {
        data.status = CommunityPostStatus.PUBLISHED;
        data.publishedAt = post.publishedAt ?? now;
        data.rejectReason = null;
      } else {
        data.status = CommunityPostStatus.PENDING;
      }
    }

    const previousBody = post.bodyText;
    const updated = await this.prisma.client.communityPost.update({
      where: { id: post.id },
      data,
      include: postInclude,
    });

    if (
      body.bodyText !== undefined &&
      updated.status === CommunityPostStatus.PUBLISHED &&
      updated.bodyText?.trim()
    ) {
      await this.mentions.notifyPostMentions({
        communityId: community.id,
        tenantId: user.tenantId,
        communitySlug: slug,
        postId: updated.id,
        actorUserId: userId,
        actorUsername: user.username,
        bodyText: updated.bodyText.trim(),
        previousBodyText: previousBody,
      });
    }

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
    const isAdmin = isCommunityAdminRole(membership.role);
    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('Cannot delete this post');
    }
    if (
      isAuthor &&
      !isAdmin &&
      (post.status === CommunityPostStatus.SCHEDULED ||
        post.status === CommunityPostStatus.REJECTED)
    ) {
      throw new BadRequestException('This post cannot be deleted');
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
      hasMore && last ? encodeModerationCursor({ createdAt: last.createdAt, id: last.id }) : null;

    const pendingCount = await this.prisma.client.communityPost.count({
      where: { communityId, deletedAt: null, status: CommunityPostStatus.PENDING },
    });

    return {
      items: page.map((post) => toPostDto({ post, communitySlug: slug, viewerUserId })),
      nextCursor,
      pendingCount,
      sort: 'recent',
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

type RankedFeedCursor = {
  personalizedScore: number;
  hotScore: number;
  id: string;
};

function encodeRankedFeedCursor(cursor: RankedFeedCursor): string {
  return Buffer.from(
    JSON.stringify({
      s: cursor.personalizedScore,
      h: cursor.hotScore,
      i: cursor.id,
    }),
    'utf8',
  ).toString('base64url');
}

function parseRankedFeedCursor(raw: string | undefined): RankedFeedCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      s?: number;
      h?: number;
      i?: string;
    };
    if (parsed.s == null || parsed.h == null || !parsed.i) {
      return null;
    }
    return {
      personalizedScore: parsed.s,
      hotScore: parsed.h,
      id: parsed.i,
    };
  } catch {
    return null;
  }
}

function isRankedRowBeforeCursor(
  row: { personalizedScore: number; hotScore: number; id: string },
  cursor: RankedFeedCursor,
): boolean {
  if (row.personalizedScore < cursor.personalizedScore) {
    return true;
  }
  if (row.personalizedScore > cursor.personalizedScore) {
    return false;
  }
  if (row.hotScore < cursor.hotScore) {
    return true;
  }
  if (row.hotScore > cursor.hotScore) {
    return false;
  }
  return row.id < cursor.id;
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
