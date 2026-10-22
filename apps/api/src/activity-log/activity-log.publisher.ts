import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  ACTIVITY_LOG_QUEUE,
  PERSIST_ACTIVITY_LOG_JOB,
} from './activity-log.constants';
import type { ActivityLogWriteEntry } from './activity-log.types';

@Injectable()
export class ActivityLogPublisher {
  private readonly logger = new Logger(ActivityLogPublisher.name);

  constructor(@InjectQueue(ACTIVITY_LOG_QUEUE) private readonly queue: Queue) {}

  record(entries: ActivityLogWriteEntry[]): void {
    if (entries.length === 0) {
      return;
    }
    void this.queue
      .add(
        PERSIST_ACTIVITY_LOG_JOB,
        { entries },
        {
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      )
      .catch((error: unknown) => {
        this.logger.warn(
          `Failed to enqueue activity log (${entries.length} entries): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }
}
