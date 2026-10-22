import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ACTIVITY_LOG_QUEUE } from './activity-log.constants';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogProcessor } from './activity-log.processor';
import { ActivityLogPublisher } from './activity-log.publisher';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogRecorder } from './activity-log.recorder';

@Module({
  imports: [forwardRef(() => AuthModule), BullModule.registerQueue({ name: ACTIVITY_LOG_QUEUE })],
  controllers: [ActivityLogController],
  providers: [ActivityLogService, ActivityLogPublisher, ActivityLogProcessor, ActivityLogRecorder],
  exports: [ActivityLogPublisher, ActivityLogRecorder],
})
export class ActivityLogModule {}
