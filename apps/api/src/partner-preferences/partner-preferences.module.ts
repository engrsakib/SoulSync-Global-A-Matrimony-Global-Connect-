import { Module } from '@nestjs/common';
import { DevUserGuard } from '../auth/dev-user.guard';
import { PartnerPreferencesController } from './partner-preferences.controller';
import { PartnerPreferencesService } from './partner-preferences.service';

@Module({
  controllers: [PartnerPreferencesController],
  providers: [PartnerPreferencesService, DevUserGuard],
})
export class PartnerPreferencesModule {}
