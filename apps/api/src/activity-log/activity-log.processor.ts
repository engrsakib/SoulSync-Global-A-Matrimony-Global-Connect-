import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { Prisma } from '@soulsync/db';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACTIVITY_LOG_QUEUE,
  PERSIST_ACTIVITY_LOG_JOB,
} from './activity-log.constants';
import type { PersistActivityLogJobPayload } from './activity-log.types';

@Processor(ACTIVITY_LOG_QUEUE)
export class ActivityLogProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityLogProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<{ inserted: number }> {
    if (job.name !== PERSIST_ACTIVITY_LOG_JOB) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return { inserted: 0 };
    }

    const payload = job.data as PersistActivityLogJobPayload;
    const entries = payload.entries ?? [];
    if (entries.length === 0) {
      return { inserted: 0 };
    }

    const data: Prisma.UserActivityLogCreateManyInput[] = entries.map((entry) => ({
      tenantId: entry.tenantId,
      userId: entry.userId,
      type: entry.type,
      title: entry.title,
      body: entry.body ?? null,
      linkPath: entry.linkPath,
      actorUserId: entry.actorUserId ?? null,
      relatedUserId: entry.relatedUserId ?? null,
      metadata:
        entry.metadata === null || entry.metadata === undefined
          ? undefined
          : (entry.metadata as Prisma.InputJsonValue),
      occurredAt: entry.occurredAt ? new Date(entry.occurredAt) : new Date(),
    }));

    const result = await this.prisma.client.userActivityLog.createMany({ data });
    return { inserted: result.count };
  }
}
