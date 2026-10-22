import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { AuditEventStatus } from '@soulsync/db';
import type { Job } from 'bullmq';
import type { Prisma } from '@soulsync/db';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ActivityLogPayloadCryptoService } from './activity-log-payload-crypto.service';
import {
  normalizeActivityWriteEntry,
  normalizeAuditWriteEntry,
} from './activity-log.types';
import {
  ACTIVITY_LOG_QUEUE,
  PERSIST_ACTIVITY_LOG_JOB,
} from './activity-log.constants';
import type {
  ActivityLogPersistEvent,
  ActivityLogWriteEntry,
  AuditLogWriteEntry,
  PersistActivityLogJobPayload,
} from './activity-log.types';

@Processor(ACTIVITY_LOG_QUEUE)
export class ActivityLogProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityLogProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly payloadCrypto: ActivityLogPayloadCryptoService,
  ) {
    super();
  }

  async process(job: Job): Promise<{ insertedAudit: number; insertedActivity: number }> {
    if (job.name !== PERSIST_ACTIVITY_LOG_JOB) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return { insertedAudit: 0, insertedActivity: 0 };
    }

    const payload = job.data as PersistActivityLogJobPayload & {
      entries?: ActivityLogWriteEntry[];
    };
    const events: ActivityLogPersistEvent[] =
      payload.events ??
      (payload.entries?.length
        ? [{ audit: null, entries: payload.entries }]
        : []);

    if (events.length === 0) {
      return { insertedAudit: 0, insertedActivity: 0 };
    }

    let insertedAudit = 0;
    let insertedActivity = 0;

    await this.prisma.client.$transaction(async (tx) => {
      for (const event of events) {
        if (event.audit?.dedupeDaily) {
          const skip = await this.shouldSkipDedupeAudit(event.audit);
          if (skip) {
            continue;
          }
        }
        if (event.audit) {
          await tx.auditEvent.create({
            data: mapAuditEntry(normalizeAuditWriteEntry(event.audit), this.payloadCrypto),
          });
          insertedAudit += 1;
        }
        if (event.entries.length > 0) {
          const result = await tx.userActivityLog.createMany({
            data: event.entries.map((entry) =>
              mapActivityEntry(normalizeActivityWriteEntry(entry), this.payloadCrypto),
            ),
          });
          insertedActivity += result.count;
        }
      }
    });

    return { insertedAudit, insertedActivity };
  }

  private async shouldSkipDedupeAudit(audit: AuditLogWriteEntry): Promise<boolean> {
    if (!audit.dedupeDaily || !audit.actorUserId || !audit.targetUserId) {
      return false;
    }
    const day = new Date().toISOString().slice(0, 10);
    const key = `audit:dedupe:${audit.type}:${audit.actorUserId}:${audit.targetUserId}:${day}`;
    try {
      if (this.redis.client.status === 'wait') {
        await this.redis.client.connect();
      }
      const set = await this.redis.client.set(key, '1', 'EX', 86_400, 'NX');
      return set === null;
    } catch {
      return false;
    }
  }
}

function mapActivityEntry(
  entry: ActivityLogWriteEntry,
  crypto: ActivityLogPayloadCryptoService,
): Prisma.UserActivityLogCreateManyInput {
  const { payloadEnc, searchTokens } = crypto.encryptPayload(entry.payload!);
  return {
    tenantId: entry.tenantId,
    userId: entry.userId,
    type: entry.type,
    title: null,
    body: null,
    linkPath: null,
    actorUserId: entry.actorUserId ?? null,
    relatedUserId: entry.relatedUserId ?? null,
    metadata: undefined,
    payloadEnc: payloadEnc as Prisma.InputJsonValue,
    searchTokens,
    occurredAt: entry.occurredAt ? new Date(entry.occurredAt) : new Date(),
  };
}

function mapAuditEntry(
  entry: AuditLogWriteEntry,
  crypto: ActivityLogPayloadCryptoService,
): Prisma.AuditEventUncheckedCreateInput {
  const { payloadEnc, searchTokens } = crypto.encryptPayload(entry.payload!);
  return {
    tenantId: entry.tenantId,
    type: entry.type,
    status: entry.status ?? AuditEventStatus.SUCCESS,
    actorUserId: entry.actorUserId ?? null,
    targetUserId: entry.targetUserId ?? null,
    linkPath: null,
    metadata: undefined,
    ipAddress: null,
    userAgent: null,
    payloadEnc: payloadEnc as Prisma.InputJsonValue,
    searchTokens,
    occurredAt: entry.occurredAt ? new Date(entry.occurredAt) : new Date(),
  };
}
