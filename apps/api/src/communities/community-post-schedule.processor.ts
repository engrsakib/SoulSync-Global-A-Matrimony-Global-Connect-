import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { CommunityPostsService } from './community-posts.service';

export const COMMUNITY_SCHEDULED_POST_QUEUE = 'community-scheduled-posts';
export const PUBLISH_SCHEDULED_POST_JOB = 'publish-scheduled-post';

export type PublishScheduledPostPayload = {
  postId: string;
};

@Processor(COMMUNITY_SCHEDULED_POST_QUEUE)
export class CommunityScheduledPostProcessor extends WorkerHost {
  private readonly logger = new Logger(CommunityScheduledPostProcessor.name);

  constructor(private readonly postsService: CommunityPostsService) {
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
