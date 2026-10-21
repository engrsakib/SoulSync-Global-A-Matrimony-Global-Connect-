import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  COMMUNITY_SCHEDULED_POST_QUEUE,
  PUBLISH_SCHEDULED_POST_JOB,
  type PublishScheduledPostPayload,
} from './community-post-schedule.constants';

@Injectable()
export class CommunityPostScheduleService {
  private readonly logger = new Logger(CommunityPostScheduleService.name);

  constructor(
    @InjectQueue(COMMUNITY_SCHEDULED_POST_QUEUE)
    private readonly queue: Queue<PublishScheduledPostPayload>,
  ) {}

  async enqueuePublish(postId: string, publishAt: Date): Promise<string> {
    const delayMs = Math.max(0, publishAt.getTime() - Date.now());
    try {
      const job = await this.queue.add(
        PUBLISH_SCHEDULED_POST_JOB,
        { postId },
        {
          delay: delayMs,
          jobId: `community-post-${postId}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      if (!job.id) {
        throw new Error('Missing job id');
      }
      return String(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Queue unavailable';
      this.logger.warn(`Could not schedule post ${postId}: ${message}`);
      throw new ServiceUnavailableException(
        'Scheduled posts require Redis. Try posting now or try again later.',
      );
    }
  }
}
