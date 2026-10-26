import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessengerController } from './messenger.controller';
import { MessengerGateway } from './messenger.gateway';
import { MessengerLinkPreviewService } from './messenger-link-preview.service';
import { MessengerPrivacyService } from './messenger-privacy.service';
import { MessengerRedisService } from './messenger-redis.service';
import { MessengerService } from './messenger.service';

@Module({
  imports: [AuthModule],
  controllers: [MessengerController],
  providers: [
    MessengerService,
    MessengerGateway,
    MessengerRedisService,
    MessengerPrivacyService,
    MessengerLinkPreviewService,
  ],
  exports: [MessengerService, MessengerPrivacyService, MessengerRedisService],
})
export class MessengerModule {}
