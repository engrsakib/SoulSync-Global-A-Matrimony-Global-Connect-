import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { MarriageConfirmationController } from './marriage-confirmation.controller';
import { MarriageConfirmationService } from './marriage-confirmation.service';

@Module({
  imports: [ActivityLogModule],
  controllers: [MarriageConfirmationController],
  providers: [MarriageConfirmationService],
  exports: [MarriageConfirmationService],
})
export class MarriageConfirmationModule {}
