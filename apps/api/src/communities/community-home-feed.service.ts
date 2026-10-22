import { Injectable } from '@nestjs/common';
import { CommunityMemberStatus, CommunityPostStatus } from '@soulsync/db';
import type { CommunityFeedDto } from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';
import { CommunityFeedRankingService } from './community-feed-ranking.service';
import { FEED_RANKING } from './feed-ranking.config';
import { toPostDto } from './community.mapper';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const postInclude = {
  author: { select: { id: true, username: true, avatarUrl: true } },
  referencedUser: { select: { id: true, username: true, avatarUrl: true } },
  images: true,
  reactions: { select: { kind: true, userId: true } },
  _count: { select: { comments: true } },
  community: { select: { slug: true, name: true, minAge: true, maxAge: true, id: true } },
} as const;

type HomeFeedCursor = { personalizedScore: number; hotScore: number; id: string };

@Injectable()
export class CommunityHomeFeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CommunityAccessService,
    private readonly feedRanking: CommunityFeedRankingService,
  ) {}

  async listHomeFeed(
    userId: string,
    options: { cursor?: string; limit?: number } = {},
  ): Promise<CommunityFeedDto> {
    const user = await this.access.requireTenantUser(userId);
    const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const cursor = parseHomeFeedCursor(options.cursor);
    const poolSize = limit * FEED_RANKING.candidateMultiplier;

    const memberships = await this.prisma.client.communityMember.findMany({
      where: {
        userId,
        tenantId: user.tenantId,
        status: CommunityMemberStatus.ACTIVE,
        community: { deletedAt: null },
      },
      select: { communityId: true },
    });

    const communityIds = memberships.map((row) => row.communityId);
    if (communityIds.length === 0) {
      return { items: [], nextCursor: null, pendingCount: null, sort: 'ranked' };
    }

    const candidates = await this.prisma.client.communityPost.findMany({
      where: {
        communityId: { in: communityIds },
        deletedAt: null,
        status: CommunityPostStatus.PUBLISHED,
        ...(cursor
          ? {
              OR: [
                { hotScore: { lt: cursor.hotScore } },
                { hotScore: cursor.hotScore, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ hotScore: 'desc' }, { id: 'desc' }],
      take: poolSize,
      include: postInclude,
    });

    const viewerContext = await this.feedRanking.buildViewerContext(userId, {
      communityIds,
    });
    const authorProfiles = await this.feedRanking.loadAuthorProfiles(
      candidates.map((post) => post.authorUserId),
    );

    const communitiesById = new Map(
      candidates.map((post) => [
        post.communityId,
        { minAge: post.community.minAge, maxAge: post.community.maxAge },
      ]),
    );

    const ranked = this.feedRanking.rankPosts(
      candidates.map((post) => ({
        id: post.id,
        authorUserId: post.authorUserId,
        hotScore: post.hotScore,
        communityId: post.communityId,
      })),
      viewerContext,
      communitiesById,
      authorProfiles,
    );

    const filtered = cursor ? ranked.filter((row) => isBeforeHomeCursor(row, cursor)) : ranked;
    const pageRanked = filtered.slice(0, limit);
    const postById = new Map(candidates.map((post) => [post.id, post]));
    const scoreById = new Map(pageRanked.map((row) => [row.id, row.personalizedScore]));

    const items = pageRanked
      .map((row) => postById.get(row.id))
      .filter((post): post is (typeof candidates)[number] => post != null)
      .map((post) =>
        toPostDto({
          post,
          communitySlug: post.community.slug,
          viewerUserId: userId,
          rankScore: scoreById.get(post.id),
          communityName: post.community.name,
        }),
      );

    const last = pageRanked[pageRanked.length - 1];
    const nextCursor =
      last && (filtered.length > limit || candidates.length >= poolSize)
        ? encodeHomeFeedCursor({
            personalizedScore: last.personalizedScore,
            hotScore: last.hotScore,
            id: last.id,
          })
        : null;

    return {
      items,
      nextCursor,
      pendingCount: null,
      sort: 'ranked',
    };
  }
}

function encodeHomeFeedCursor(cursor: HomeFeedCursor): string {
  return Buffer.from(
    JSON.stringify({ s: cursor.personalizedScore, h: cursor.hotScore, i: cursor.id }),
    'utf8',
  ).toString('base64url');
}

function parseHomeFeedCursor(raw: string | undefined): HomeFeedCursor | null {
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
    return { personalizedScore: parsed.s, hotScore: parsed.h, id: parsed.i };
  } catch {
    return null;
  }
}

function isBeforeHomeCursor(
  row: { personalizedScore: number; hotScore: number; id: string },
  cursor: HomeFeedCursor,
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
