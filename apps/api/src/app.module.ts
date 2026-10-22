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
import { BiodataEditorModule } from './biodata-editor/biodata-editor.module';
import { GeoModule } from './geo/geo.module';
import { CheckInModule } from './check-in/check-in.module';
import { InactivityModule } from './inactivity/inactivity.module';
import { QueueModule } from './queue/queue.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { WalletModule } from './wallet/wallet.module';
import { StatsModule } from './stats/stats.module';
import { CommunitiesModule } from './communities/communities.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CompatibilityModule } from './compatibility/compatibility.module';
import { ProfilesModule } from './profiles/profiles.module';

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
    BiodataEditorModule,
    CheckInModule,
    QueueModule,
    InactivityModule,
    ActivityLogModule,
    WalletModule,
    GeoModule,
    CommunitiesModule,
    NotificationsModule,
    CompatibilityModule,
    ProfilesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
