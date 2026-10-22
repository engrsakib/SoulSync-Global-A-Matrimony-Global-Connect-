import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, UserActivityType } from '@soulsync/db';
import type {
  UserActivityLogActorDto,
  UserActivityLogDto,
  UserActivityLogListDto,
} from '@soulsync/shared-types/activity-log';
import { effectiveCheckInTimeZone } from '@soulsync/shared-types/check-in';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogPayloadCryptoService } from './activity-log-payload-crypto.service';
import { resolveStoredActivityPayload } from './activity-log-payload.resolver';
import { presentMemberActivityRow } from './activity-log.presenter';
import type { ActivityLogListQuery, ActivityLogListSort } from './activity-log.types';
import {
  ActivityLogUserLabelService,
  type ActivityLogUserRow,
} from './activity-log-user-label.service';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

@Injectable()
export class ActivityLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userLabels: ActivityLogUserLabelService,
    private readonly payloadCrypto: ActivityLogPayloadCryptoService,
  ) {}

  async listForUser(userId: string, query: ActivityLogListQuery = {}): Promise<UserActivityLogListDto> {
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

    const sort: ActivityLogListSort = query.sort ?? 'newest';
    const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const parsedCursor = parseActivityCursor(query.cursor, sort);
    const searchTokens = query.q?.trim()
      ? this.payloadCrypto.tokensForQuery(query.q.trim())
      : [];

    const where: Prisma.UserActivityLogWhereInput = {
      userId,
      ...(query.types?.length ? { type: { in: query.types } } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            occurredAt: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
      ...(searchTokens.length > 0 ? { searchTokens: { hasEvery: searchTokens } } : {}),
      ...(parsedCursor ? cursorWhere(parsedCursor, sort) : {}),
    };

    const rows = await this.prisma.client.userActivityLog.findMany({
      where,
      orderBy: orderByForSort(sort),
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeActivityCursor({ occurredAt: last.occurredAt, id: last.id }, sort)
        : null;

    const actorIds: string[] = [
      ...new Set(
        page.flatMap((row) =>
          [row.actorUserId, row.relatedUserId].filter((id): id is string => Boolean(id)),
        ),
      ),
    ];

    const userMap = await this.userLabels.loadSnippetsByIds(actorIds);

    return {
      items: page.map((row) => toActivityDto(row, userId, userMap, this.userLabels, this.payloadCrypto)),
      nextCursor,
      viewerTimeZone: effectiveCheckInTimeZone(user.profile?.checkInTimeZone ?? null),
    };
  }
}

function orderByForSort(sort: ActivityLogListSort): Prisma.UserActivityLogOrderByWithRelationInput[] {
  if (sort === 'oldest') {
    return [{ occurredAt: 'asc' }, { id: 'asc' }];
  }
  return [{ occurredAt: 'desc' }, { id: 'desc' }];
}

function cursorWhere(
  cursor: ActivityCursor,
  sort: ActivityLogListSort,
): Prisma.UserActivityLogWhereInput {
  if (sort === 'oldest') {
    return {
      OR: [
        { occurredAt: { gt: cursor.occurredAt } },
        { occurredAt: cursor.occurredAt, id: { gt: cursor.id } },
      ],
    };
  }
  return {
    OR: [
      { occurredAt: { lt: cursor.occurredAt } },
      { occurredAt: cursor.occurredAt, id: { lt: cursor.id } },
    ],
  };
}

function toActorDto(
  userId: string,
  userMap: Map<string, ActivityLogUserRow>,
  labels: ActivityLogUserLabelService,
): UserActivityLogActorDto | null {
  const user = userMap.get(userId);
  if (!user) {
    return null;
  }
  const snippet = labels.toSnippet(user);
  return {
    userId: snippet.userId,
    username: snippet.username,
    displayName: snippet.displayName,
    avatarUrl: snippet.avatarUrl,
  };
}

function toActivityDto(
  row: {
    id: string;
    userId: string;
    type: UserActivityType;
    title: string | null;
    body: string | null;
    linkPath: string | null;
    actorUserId: string | null;
    relatedUserId: string | null;
    metadata: unknown;
    payloadEnc: unknown;
    occurredAt: Date;
  },
  feedUserId: string,
  userMap: Map<string, ActivityLogUserRow>,
  labels: ActivityLogUserLabelService,
  crypto: ActivityLogPayloadCryptoService,
): UserActivityLogDto {
  const resolved = resolveStoredActivityPayload(row, crypto);
  const metadata = resolved.metadata;

  const actorRow = row.actorUserId ? userMap.get(row.actorUserId) : undefined;
  const relatedRow = row.relatedUserId ? userMap.get(row.relatedUserId) : undefined;

  const presented = presentMemberActivityRow({
    feedUserId,
    type: row.type,
    storedTitle: resolved.title,
    storedBody: resolved.body,
    actorUserId: row.actorUserId,
    relatedUserId: row.relatedUserId,
    metadata,
    actorLabel: actorRow ? labels.decryptLabel(actorRow) : null,
    relatedLabel: relatedRow ? labels.decryptLabel(relatedRow) : null,
  });

  return {
    id: row.id,
    type: row.type,
    title: presented.title,
    body: presented.body,
    linkPath: resolved.linkPath,
    actor: row.actorUserId ? toActorDto(row.actorUserId, userMap, labels) : null,
    related: row.relatedUserId ? toActorDto(row.relatedUserId, userMap, labels) : null,
    metadata,
    occurredAt: row.occurredAt.toISOString(),
  };
}

type ActivityCursor = { occurredAt: Date; id: string; sort: ActivityLogListSort };

function encodeActivityCursor(cursor: Omit<ActivityCursor, 'sort'>, sort: ActivityLogListSort): string {
  return Buffer.from(
    JSON.stringify({ o: cursor.occurredAt.toISOString(), i: cursor.id, s: sort }),
    'utf8',
  ).toString('base64url');
}

function parseActivityCursor(
  raw: string | undefined,
  expectedSort: ActivityLogListSort,
): ActivityCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      o?: string;
      i?: string;
      s?: ActivityLogListSort;
    };
    if (!parsed.o || !parsed.i) {
      return null;
    }
    if (parsed.s && parsed.s !== expectedSort) {
      return null;
    }
    const occurredAt = new Date(parsed.o);
    if (Number.isNaN(occurredAt.getTime())) {
      return null;
    }
    return { occurredAt, id: parsed.i, sort: expectedSort };
  } catch {
    return null;
  }
}
