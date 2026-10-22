import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ACTIVITY_LOG_QUEUE } from './activity-log.constants';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogProcessor } from './activity-log.processor';
import { ActivityLogPublisher } from './activity-log.publisher';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogRecorder } from './activity-log.recorder';
import { ActivityLogUserLabelService } from './activity-log-user-label.service';
import { RedisModule } from '../redis/redis.module';
import { CryptoModule } from '../crypto/crypto.module';
import { ActivityLogPayloadCryptoService } from './activity-log-payload-crypto.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    CryptoModule,
    RedisModule,
    BullModule.registerQueue({ name: ACTIVITY_LOG_QUEUE }),
  ],
  controllers: [ActivityLogController],
  providers: [
    ActivityLogService,
    ActivityLogPublisher,
    ActivityLogProcessor,
    ActivityLogRecorder,
    ActivityLogUserLabelService,
    ActivityLogPayloadCryptoService,
  ],
  exports: [
    ActivityLogPublisher,
    ActivityLogRecorder,
    ActivityLogUserLabelService,
    ActivityLogPayloadCryptoService,
  ],
})
export class ActivityLogModule {}
