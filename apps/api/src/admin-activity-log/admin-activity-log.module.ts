import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { AdminActivityLogController } from './admin-activity-log.controller';
import { AdminActivityLogService } from './admin-activity-log.service';

@Module({
  imports: [AuthModule, ActivityLogModule],
  controllers: [AdminActivityLogController],
  providers: [AdminActivityLogService],
})
export class AdminActivityLogModule {}
