import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { PartnerPreferencesModule } from './partner-preferences/partner-preferences.module';
import { TenantsModule } from './tenants/tenants.module';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { CryptoModule } from './crypto/crypto.module';
import { BiodataModule } from './biodata/biodata.module';
import { BiodataVisibilityModule } from './biodata-visibility/biodata-visibility.module';
import { GeoModule } from './geo/geo.module';
import { CheckInModule } from './check-in/check-in.module';
import { InactivityModule } from './inactivity/inactivity.module';
import { WalletModule } from './wallet/wallet.module';
import { StatsModule } from './stats/stats.module';
import { CommunitiesModule } from './communities/communities.module';

@Module({
  imports: [
    AppConfigModule,
    CryptoModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    TenantsModule,
    StatsModule,
    PartnerPreferencesModule,
    AuthModule,
    MediaModule,
    BiodataModule,
    BiodataVisibilityModule,
    CheckInModule,
    InactivityModule,
    WalletModule,
    GeoModule,
    CommunitiesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
