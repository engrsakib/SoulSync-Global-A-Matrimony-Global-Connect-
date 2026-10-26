import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CryptoModule } from '../crypto/crypto.module';
import { MessengerController } from './messenger.controller';
import { MessengerGiphyService } from './messenger-giphy.service';
import { MessengerGateway } from './messenger.gateway';
import { MessengerLinkPreviewService } from './messenger-link-preview.service';
import { MessengerPrivacyService } from './messenger-privacy.service';
import { MessengerRedisService } from './messenger-redis.service';
import { MESSENGER_SCHEDULED_MESSAGE_QUEUE } from './messenger-schedule.constants';
import { MessengerScheduleProcessor } from './messenger-schedule.processor';
import { MessengerScheduleQueueService } from './messenger-schedule-queue.service';
import { MessengerScheduledService } from './messenger-scheduled.service';
import { MessengerService } from './messenger.service';

@Module({
  imports: [
    AuthModule,
    CryptoModule,
    BullModule.registerQueue({ name: MESSENGER_SCHEDULED_MESSAGE_QUEUE }),
  ],
  controllers: [MessengerController],
  providers: [
    MessengerService,
    MessengerGateway,
    MessengerRedisService,
    MessengerPrivacyService,
    MessengerLinkPreviewService,
    MessengerGiphyService,
    MessengerScheduleQueueService,
    MessengerScheduledService,
    MessengerScheduleProcessor,
  ],
  exports: [MessengerService, MessengerPrivacyService, MessengerRedisService],
})
export class MessengerModule {}
