import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { InactivityProcessor, PROFILE_INACTIVITY_QUEUE } from './inactivity.processor';
import { InactivitySchedulerService } from './inactivity.scheduler';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: { url: config.get('REDIS_URL', { infer: true }) },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: PROFILE_INACTIVITY_QUEUE }),
  ],
  providers: [InactivityProcessor, InactivitySchedulerService],
})
export class InactivityModule {}
