import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import type { Env } from '../config/env.schema';
import { PROFILE_INACTIVITY_QUEUE, SCAN_INACTIVE_PROFILES_JOB } from './inactivity.processor';

const SCHEDULER_ID = 'daily-inactivity-scan';

@Injectable()
export class InactivitySchedulerService implements OnModuleInit {
  private readonly logger = new Logger(InactivitySchedulerService.name);

  constructor(
    @InjectQueue(PROFILE_INACTIVITY_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onModuleInit(): Promise<void> {
    const pattern = this.config.get('INACTIVITY_CRON', { infer: true });
    const nodeEnv = this.config.get('NODE_ENV', { infer: true });

    try {
      await this.queue.upsertJobScheduler(
        SCHEDULER_ID,
        { pattern },
        {
          name: SCAN_INACTIVE_PROFILES_JOB,
          data: {},
          opts: {
            removeOnComplete: true,
            removeOnFail: 100,
          },
        },
      );
      this.logger.log(`Registered inactivity job scheduler (${pattern})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (nodeEnv === 'production') {
        throw error;
      }
      this.logger.warn(`Could not register inactivity scheduler (Redis?): ${message}`);
    }
  }
}
