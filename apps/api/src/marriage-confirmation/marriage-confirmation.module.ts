import { forwardRef, Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { AuthModule } from '../auth/auth.module';
import { MarriageRecordModule } from '../marriage-record/marriage-record.module';
import { MarriageConfirmationController } from './marriage-confirmation.controller';
import { MarriageConfirmationService } from './marriage-confirmation.service';

@Module({
  imports: [AuthModule, ActivityLogModule, forwardRef(() => MarriageRecordModule)],
  controllers: [MarriageConfirmationController],
  providers: [MarriageConfirmationService],
  exports: [MarriageConfirmationService],
})
export class MarriageConfirmationModule {}
