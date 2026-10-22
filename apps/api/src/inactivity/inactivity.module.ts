import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { InactivityProcessor, PROFILE_INACTIVITY_QUEUE } from './inactivity.processor';
import { InactivitySchedulerService } from './inactivity.scheduler';

@Module({
  imports: [BullModule.registerQueue({ name: PROFILE_INACTIVITY_QUEUE })],
  providers: [InactivityProcessor, InactivitySchedulerService],
})
export class InactivityModule {}
