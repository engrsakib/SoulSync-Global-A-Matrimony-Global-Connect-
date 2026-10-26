import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  DELIVER_SCHEDULED_MESSAGE_JOB,
  MESSENGER_SCHEDULED_MESSAGE_QUEUE,
  type DeliverScheduledMessagePayload,
} from './messenger-schedule.constants';

@Injectable()
export class MessengerScheduleQueueService {
  private readonly logger = new Logger(MessengerScheduleQueueService.name);

  constructor(
    @InjectQueue(MESSENGER_SCHEDULED_MESSAGE_QUEUE)
    private readonly queue: Queue<DeliverScheduledMessagePayload>,
  ) {}

  async enqueueDeliver(scheduleId: string, scheduledAt: Date): Promise<string> {
    const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
    try {
      const job = await this.queue.add(
        DELIVER_SCHEDULED_MESSAGE_JOB,
        { scheduleId },
        {
          delay: delayMs,
          jobId: `messenger-schedule-${scheduleId}`,
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 8,
          backoff: { type: 'exponential', delay: 60_000 },
        },
      );
      if (!job.id) {
        throw new Error('Missing job id');
      }
      return String(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Queue unavailable';
      this.logger.warn(`Could not schedule message ${scheduleId}: ${message}`);
      throw new ServiceUnavailableException(
        'Scheduled messages require Redis. Try sending now or try again later.',
      );
    }
  }

  async removeJob(scheduleId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(`messenger-schedule-${scheduleId}`);
      if (job) {
        await job.remove();
      }
    } catch {
      /* ignore */
    }
  }
}
