import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import type { Env } from '../config/env.schema';
import { PrismaService } from '../prisma/prisma.service';

export const PROFILE_INACTIVITY_QUEUE = 'profile-inactivity';
export const SCAN_INACTIVE_PROFILES_JOB = 'scan-inactive-profiles';

@Processor(PROFILE_INACTIVITY_QUEUE)
export class InactivityProcessor extends WorkerHost {
  private readonly logger = new Logger(InactivityProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {
    super();
  }

  async process(job: Job): Promise<{ updated: number }> {
    if (job.name !== SCAN_INACTIVE_PROFILES_JOB) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return { updated: 0 };
    }

    const limitDays = this.config.get('INACTIVITY_LIMIT_DAYS', { infer: true });
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - limitDays);

    const result = await this.prisma.client.profile.updateMany({
      where: {
        isVisibilityPrivate: false,
        user: {
          lastCheckInAt: { not: null, lt: cutoff },
        },
      },
      data: {
        isVisibilityPrivate: true,
        isDiscoverable: false,
      },
    });

    this.logger.log(
      `Inactivity scan: set ${result.count} profile(s) private (cutoff ${cutoff.toISOString()})`,
    );
    return { updated: result.count };
  }
}
