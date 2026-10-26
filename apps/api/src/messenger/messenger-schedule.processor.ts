import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  DELIVER_SCHEDULED_MESSAGE_JOB,
  MESSENGER_SCHEDULED_MESSAGE_QUEUE,
  type DeliverScheduledMessagePayload,
} from './messenger-schedule.constants';
import { MessengerScheduledService } from './messenger-scheduled.service';

@Processor(MESSENGER_SCHEDULED_MESSAGE_QUEUE)
export class MessengerScheduleProcessor extends WorkerHost {
  private readonly logger = new Logger(MessengerScheduleProcessor.name);

  constructor(private readonly scheduled: MessengerScheduledService) {
    super();
  }

  async process(job: Job<DeliverScheduledMessagePayload>): Promise<void> {
    if (job.name !== DELIVER_SCHEDULED_MESSAGE_JOB) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }
    const scheduleId = job.data.scheduleId;
    if (!scheduleId) {
      return;
    }
    try {
      await this.scheduled.deliverDueSchedule(scheduleId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'deliver failed';
      await this.scheduled.recordDeliveryFailure(scheduleId, message);
      if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
        await this.scheduled.markFailedAfterAttempts(scheduleId);
      }
      throw error;
    }
  }
}
