import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { BiodataModule } from '../biodata/biodata.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ProfileResumeController } from './profile-resume.controller';
import { ProfileResumeService } from './profile-resume.service';
import { ProfileResumeThrottlerGuard } from './profile-resume-throttler.guard';

@Module({
  imports: [
    AuthModule,
    BiodataModule,
    ActivityLogModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'default', ttl: 60_000, limit: 20 },
        { name: 'profileResume', ttl: 60_000, limit: 10 },
      ],
    }),
  ],
  controllers: [ProfileResumeController],
  providers: [ProfileResumeService, ProfileResumeThrottlerGuard],
})
export class ProfilesModule {}
