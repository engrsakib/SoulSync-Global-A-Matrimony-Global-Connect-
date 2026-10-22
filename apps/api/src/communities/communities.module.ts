import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CryptoModule } from '../crypto/crypto.module';
import { CommunitiesController } from './communities.controller';
import { CommunityPostShareController } from './community-post-share.controller';
import { CommunitiesService } from './communities.service';
import { CommunityAccessService } from './community-access.service';
import { CommunityCommentsService } from './community-comments.service';
import { CommunityEligibilityService } from './community-eligibility.service';
import { CommunityJoinRequestsService } from './community-join-requests.service';
import { CommunityMembersService } from './community-members.service';
import { CommunityPostsService } from './community-posts.service';
import { CommunityReactionsService } from './community-reactions.service';
import { CommunitySlugService } from './community-slug.service';
import { COMMUNITY_SCHEDULED_POST_QUEUE } from './community-post-schedule.constants';
import { CommunityScheduledPostProcessor } from './community-post-schedule.processor';
import { CommunityPostScheduleService } from './community-post-schedule.service';
import { CommunityMentionsService } from './community-mentions.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    CryptoModule,
    NotificationsModule,
    BullModule.registerQueue({ name: COMMUNITY_SCHEDULED_POST_QUEUE }),
  ],
  controllers: [CommunitiesController, CommunityPostShareController],
  providers: [
    CommunityAccessService,
    CommunitySlugService,
    CommunityEligibilityService,
    CommunitiesService,
    CommunityJoinRequestsService,
    CommunityMembersService,
    CommunityPostsService,
    CommunityCommentsService,
    CommunityMentionsService,
    CommunityReactionsService,
    CommunityPostScheduleService,
    CommunityScheduledPostProcessor,
  ],
})
export class CommunitiesModule {}
