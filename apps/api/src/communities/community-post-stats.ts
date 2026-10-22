import { CommunityPostStatus, type PrismaClient } from '@soulsync/db';

export type CommunityPostStats = {
  postsToday: number;
  averagePostsPerDay: number;
};

function startOfUtcDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function daysSince(isoOrDate: Date, now = new Date()): number {
  const ms = now.getTime() - isoOrDate.getTime();
  if (ms <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function averagePostsPerDay(totalPublished: number, communityCreatedAt: Date): number {
  const days = daysSince(communityCreatedAt);
  const avg = totalPublished / days;
  return Math.round(avg * 10) / 10;
}

const publishedPostWhere = {
  status: CommunityPostStatus.PUBLISHED,
  deletedAt: null,
} as const;

export async function loadCommunityPostStats(
  prisma: PrismaClient,
  communityId: string,
  communityCreatedAt: Date,
): Promise<CommunityPostStats> {
  const startOfDay = startOfUtcDay();
  const [totalPublished, postsToday] = await Promise.all([
    prisma.communityPost.count({
      where: { communityId, ...publishedPostWhere },
    }),
    prisma.communityPost.count({
      where: {
        communityId,
        ...publishedPostWhere,
        publishedAt: { gte: startOfDay },
      },
    }),
  ]);

  return {
    postsToday,
    averagePostsPerDay: averagePostsPerDay(totalPublished, communityCreatedAt),
  };
}

export async function loadCommunityPostStatsBatch(
  prisma: PrismaClient,
  communities: { id: string; createdAt: Date }[],
): Promise<Map<string, CommunityPostStats>> {
  const result = new Map<string, CommunityPostStats>();
  if (communities.length === 0) {
    return result;
  }

  const ids = communities.map((c) => c.id);
  const createdAtById = new Map(communities.map((c) => [c.id, c.createdAt]));
  const startOfDay = startOfUtcDay();

  const [totalRows, todayRows] = await Promise.all([
    prisma.communityPost.groupBy({
      by: ['communityId'],
      where: { communityId: { in: ids }, ...publishedPostWhere },
      _count: { _all: true },
    }),
    prisma.communityPost.groupBy({
      by: ['communityId'],
      where: {
        communityId: { in: ids },
        ...publishedPostWhere,
        publishedAt: { gte: startOfDay },
      },
      _count: { _all: true },
    }),
  ]);

  const totalById = new Map(totalRows.map((row) => [row.communityId, row._count._all]));
  const todayById = new Map(todayRows.map((row) => [row.communityId, row._count._all]));

  for (const id of ids) {
    const createdAt = createdAtById.get(id)!;
    const total = totalById.get(id) ?? 0;
    result.set(id, {
      postsToday: todayById.get(id) ?? 0,
      averagePostsPerDay: averagePostsPerDay(total, createdAt),
    });
  }

  return result;
}
