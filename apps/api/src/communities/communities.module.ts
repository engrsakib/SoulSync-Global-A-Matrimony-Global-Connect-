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

@Module({
  imports: [AuthModule, CryptoModule],
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
    CommunityReactionsService,
  ],
})
export class CommunitiesModule {}
