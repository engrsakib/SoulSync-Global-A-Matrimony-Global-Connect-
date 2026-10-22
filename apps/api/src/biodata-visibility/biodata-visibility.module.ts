import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CryptoModule } from '../crypto/crypto.module';
import { BiodataVisibilityController } from './biodata-visibility.controller';
import { BiodataVisibilityService } from './biodata-visibility.service';

@Module({
  imports: [AuthModule, CryptoModule],
  controllers: [BiodataVisibilityController],
  providers: [BiodataVisibilityService],
  exports: [BiodataVisibilityService],
})
export class BiodataVisibilityModule {}
