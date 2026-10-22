import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartnerPreferencesController } from './partner-preferences.controller';
import { PartnerPreferencesService } from './partner-preferences.service';

@Module({
  imports: [AuthModule],
  controllers: [PartnerPreferencesController],
  providers: [PartnerPreferencesService],
})
export class PartnerPreferencesModule {}
