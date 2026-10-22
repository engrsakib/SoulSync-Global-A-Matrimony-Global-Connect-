import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuditEventStatus, AuditEventType, Prisma } from '@soulsync/db';
import { UserRole } from '@soulsync/db';
import type { AuditEventDto, AuditEventListDto } from '@soulsync/shared-types/audit-log';
import { PrismaService } from '../prisma/prisma.service';
import { presentAuditEventTitle } from '../activity-log/activity-log.presenter';
import { ActivityLogUserLabelService } from '../activity-log/activity-log-user-label.service';
import { ActivityLogPayloadCryptoService } from '../activity-log/activity-log-payload-crypto.service';
import { resolveStoredActivityPayload } from '../activity-log/activity-log-payload.resolver';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

export type AdminActivityLogQuery = {
  actorId?: string;
  targetUserId?: string;
  otherUserId?: string;
  type?: AuditEventType;
  status?: AuditEventStatus;
  dateFrom?: string;
  dateTo?: string;
  tenantId?: string;
  cursor?: string;
  limit?: number;
};

@Injectable()
export class AdminActivityLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userLabels: ActivityLogUserLabelService,
    private readonly payloadCrypto: ActivityLogPayloadCryptoService,
  ) {}

  async listForAdmin(
    callerRole: string,
    callerTenantId: string,
    query: AdminActivityLogQuery,
  ): Promise<AuditEventListDto> {
    const tenantId = this.resolveTenantScope(callerRole, callerTenantId, query.tenantId);
    const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const parsedCursor = parseAuditCursor(query.cursor);

    const where = buildAuditWhere(tenantId, query, parsedCursor);

    const rows = await this.prisma.client.auditEvent.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeAuditCursor({ occurredAt: last.occurredAt, id: last.id })
        : null;

    return {
      items: await this.toDtoList(page),
      nextCursor,
    };
  }

  async timelineForUser(
    callerRole: string,
    callerTenantId: string,
    userId: string,
    query: Omit<AdminActivityLogQuery, 'actorId' | 'targetUserId'>,
  ): Promise<AuditEventListDto> {
    const tenantId = this.resolveTenantScope(callerRole, callerTenantId, query.tenantId);
    await this.assertUserInTenant(userId, tenantId, callerRole);

    const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const parsedCursor = parseAuditCursor(query.cursor);

    const dyad = query.otherUserId
      ? {
          OR: [
            { actorUserId: userId, targetUserId: query.otherUserId },
            { actorUserId: query.otherUserId, targetUserId: userId },
          ],
        }
      : {
          OR: [{ actorUserId: userId }, { targetUserId: userId }],
        };

    const where: Prisma.AuditEventWhereInput = {
      AND: [
        { tenantId },
        dyad,
        ...(query.type ? [{ type: query.type }] : []),
        ...(query.status ? [{ status: query.status }] : []),
        ...(query.dateFrom || query.dateTo
          ? [
              {
                occurredAt: {
                  ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                  ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
                },
              },
            ]
          : []),
        ...(parsedCursor
          ? [
              {
                OR: [
                  { occurredAt: { lt: parsedCursor.occurredAt } },
                  { occurredAt: parsedCursor.occurredAt, id: { lt: parsedCursor.id } },
                ],
              },
            ]
          : []),
      ],
    };

    const rows = await this.prisma.client.auditEvent.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeAuditCursor({ occurredAt: last.occurredAt, id: last.id })
        : null;

    return {
      items: await this.toDtoList(page),
      nextCursor,
    };
  }

  private resolveTenantScope(
    callerRole: string,
    callerTenantId: string,
    requestedTenantId?: string,
  ): string {
    if (callerRole === UserRole.SUPER_ADMIN) {
      if (!requestedTenantId) {
        throw new ForbiddenException('tenantId is required for super admin audit queries');
      }
      return requestedTenantId;
    }
    if (requestedTenantId && requestedTenantId !== callerTenantId) {
      throw new ForbiddenException('Cannot query another tenant');
    }
    return callerTenantId;
  }

  private async assertUserInTenant(
    userId: string,
    tenantId: string,
    callerRole: string,
  ): Promise<void> {
    if (callerRole === UserRole.SUPER_ADMIN) {
      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });
      if (!user || user.tenantId !== tenantId) {
        throw new NotFoundException('User not found in tenant');
      }
      return;
    }
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async toDtoList(
    rows: Array<{
      id: string;
      tenantId: string;
      type: AuditEventType;
      status: AuditEventStatus;
      actorUserId: string | null;
      targetUserId: string | null;
      linkPath: string | null;
      metadata: unknown;
      payloadEnc: unknown;
      ipAddress: string | null;
      userAgent: string | null;
      occurredAt: Date;
    }>,
  ): Promise<AuditEventDto[]> {
    const ids = [
      ...new Set(
        rows.flatMap((r) =>
          [r.actorUserId, r.targetUserId].filter((id): id is string => Boolean(id)),
        ),
      ),
    ];
    const userMap = await this.userLabels.loadSnippetsByIds(ids);

    return rows.map((row) => {
      const resolved = resolveStoredActivityPayload(row, this.payloadCrypto);
      const metadata = resolved.metadata;
      const actorRow = row.actorUserId ? userMap.get(row.actorUserId) : undefined;
      const targetRow = row.targetUserId ? userMap.get(row.targetUserId) : undefined;
      const actorLabel = actorRow ? this.userLabels.decryptLabel(actorRow) : null;
      const targetLabel = targetRow ? this.userLabels.decryptLabel(targetRow) : null;

      return {
        id: row.id,
        tenantId: row.tenantId,
        type: row.type,
        status: row.status,
        title: presentAuditEventTitle({
          type: row.type,
          actorLabel,
          targetLabel,
          metadata,
        }),
        actor: actorRow ? this.userLabels.toSnippet(actorRow) : null,
        target: targetRow ? this.userLabels.toSnippet(targetRow) : null,
        linkPath: resolved.linkPath,
        metadata: sanitizeAuditMetadata(metadata),
        ipAddress: resolved.ipAddress,
        userAgent: resolved.userAgent,
        occurredAt: row.occurredAt.toISOString(),
      };
    });
  }
}

function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!metadata) {
    return null;
  }
  const allowed = ['sectionId', 'sectionTitle', 'sectionIds', 'decision', 'postId', 'commentId', 'kind'];
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in metadata) {
      out[key] = metadata[key];
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

function buildAuditWhere(
  tenantId: string,
  query: AdminActivityLogQuery,
  parsedCursor: AuditCursor | null,
): Prisma.AuditEventWhereInput {
  return {
    AND: [
      { tenantId },
      ...(query.actorId ? [{ actorUserId: query.actorId }] : []),
      ...(query.targetUserId ? [{ targetUserId: query.targetUserId }] : []),
      ...(query.type ? [{ type: query.type }] : []),
      ...(query.status ? [{ status: query.status }] : []),
      ...(query.dateFrom || query.dateTo
        ? [
            {
              occurredAt: {
                ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
              },
            },
          ]
        : []),
      ...(parsedCursor
        ? [
            {
              OR: [
                { occurredAt: { lt: parsedCursor.occurredAt } },
                { occurredAt: parsedCursor.occurredAt, id: { lt: parsedCursor.id } },
              ],
            },
          ]
        : []),
    ],
  };
}

type AuditCursor = { occurredAt: Date; id: string };

function encodeAuditCursor(cursor: AuditCursor): string {
  return Buffer.from(
    JSON.stringify({ o: cursor.occurredAt.toISOString(), i: cursor.id }),
    'utf8',
  ).toString('base64url');
}

function parseAuditCursor(raw: string | undefined): AuditCursor | null {
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
