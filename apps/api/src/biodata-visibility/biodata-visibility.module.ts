import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BiodataVisibilityController } from './biodata-visibility.controller';
import { BiodataVisibilityService } from './biodata-visibility.service';

@Module({
  imports: [AuthModule],
  controllers: [BiodataVisibilityController],
  providers: [BiodataVisibilityService],
})
export class BiodataVisibilityModule {}
