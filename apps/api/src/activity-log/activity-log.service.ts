import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserActivityType } from '@soulsync/db';
import type {
  UserActivityLogActorDto,
  UserActivityLogDto,
  UserActivityLogListDto,
} from '@soulsync/shared-types/activity-log';
import { effectiveCheckInTimeZone } from '@soulsync/shared-types/check-in';
import { PrismaService } from '../prisma/prisma.service';
import { buildUserActivityLabel } from './activity-log.builder';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

const userSelect = {
  id: true,
  tenantId: true,
  username: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  profile: { select: { displayName: true } },
} as const;

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    userId: string,
    cursor?: string,
    limitRaw?: number,
  ): Promise<UserActivityLogListDto> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profile: { select: { checkInTimeZone: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limit = Math.min(Math.max(limitRaw ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const parsedCursor = parseActivityCursor(cursor);

    const rows = await this.prisma.client.userActivityLog.findMany({
      where: {
        userId,
        ...(parsedCursor
          ? {
              OR: [
                { occurredAt: { lt: parsedCursor.occurredAt } },
                {
                  occurredAt: parsedCursor.occurredAt,
                  id: { lt: parsedCursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeActivityCursor({ occurredAt: last.occurredAt, id: last.id })
        : null;

    const actorIds: string[] = [
      ...new Set(
        page.flatMap((row) =>
          [row.actorUserId, row.relatedUserId].filter((id): id is string => Boolean(id)),
        ),
      ),
    ];

    const actors =
      actorIds.length > 0
        ? await this.prisma.client.user.findMany({
            where: { id: { in: actorIds } },
            select: userSelect,
          })
        : [];
    const actorMap = new Map(actors.map((u) => [u.id, toActorDto(u)]));

    return {
      items: page.map((row) => toActivityDto(row, actorMap)),
      nextCursor,
      viewerTimeZone: effectiveCheckInTimeZone(user.profile?.checkInTimeZone ?? null),
    };
  }
}

function toActorDto(user: {
  id: string;
  tenantId: string;
  username: string | null;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  profile: { displayName: string | null } | null;
}): UserActivityLogActorDto {
  return {
    userId: user.id,
    username: user.username,
    displayName: buildUserActivityLabel(user),
    avatarUrl: user.avatarUrl,
  };
}

function toActivityDto(
  row: {
    id: string;
    type: UserActivityType;
    title: string;
    body: string | null;
    linkPath: string;
    actorUserId: string | null;
    relatedUserId: string | null;
    metadata: unknown;
    occurredAt: Date;
  },
  actorMap: Map<string, UserActivityLogActorDto>,
): UserActivityLogDto {
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : null;

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkPath: row.linkPath,
    actor: row.actorUserId ? (actorMap.get(row.actorUserId) ?? null) : null,
    related: row.relatedUserId ? (actorMap.get(row.relatedUserId) ?? null) : null,
    metadata,
    occurredAt: row.occurredAt.toISOString(),
  };
}

type ActivityCursor = { occurredAt: Date; id: string };

function encodeActivityCursor(cursor: ActivityCursor): string {
  return Buffer.from(
    JSON.stringify({ o: cursor.occurredAt.toISOString(), i: cursor.id }),
    'utf8',
  ).toString('base64url');
}

function parseActivityCursor(raw: string | undefined): ActivityCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      o?: string;
      i?: string;
    };
    if (!parsed.o || !parsed.i) {
      return null;
    }
    const occurredAt = new Date(parsed.o);
    if (Number.isNaN(occurredAt.getTime())) {
      return null;
    }
    return { occurredAt, id: parsed.i };
  } catch {
    return null;
  }
}
