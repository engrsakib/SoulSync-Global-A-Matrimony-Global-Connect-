import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CryptoModule } from '../crypto/crypto.module';
import { BiodataVisibilityController } from './biodata-visibility.controller';
import { BiodataVisibilityService } from './biodata-visibility.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [AuthModule, CryptoModule, ActivityLogModule],
  controllers: [BiodataVisibilityController],
  providers: [BiodataVisibilityService],
  exports: [BiodataVisibilityService],
})
export class BiodataVisibilityModule {}
