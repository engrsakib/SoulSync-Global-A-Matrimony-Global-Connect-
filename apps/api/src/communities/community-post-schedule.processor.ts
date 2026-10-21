import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  COMMUNITY_SCHEDULED_POST_QUEUE,
  PUBLISH_SCHEDULED_POST_JOB,
  type PublishScheduledPostPayload,
} from './community-post-schedule.constants';
import { CommunityPostsService } from './community-posts.service';

@Processor(COMMUNITY_SCHEDULED_POST_QUEUE)
export class CommunityScheduledPostProcessor extends WorkerHost {
  private readonly logger = new Logger(CommunityScheduledPostProcessor.name);

  constructor(
    @Inject(forwardRef(() => CommunityPostsService))
    private readonly postsService: CommunityPostsService,
  ) {
    super();
  }

  async process(job: Job<PublishScheduledPostPayload>): Promise<void> {
    if (job.name !== PUBLISH_SCHEDULED_POST_JOB) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }
    const postId = job.data.postId;
    if (!postId) {
      return;
    }
    await this.postsService.publishScheduledPost(postId);
  }
}
