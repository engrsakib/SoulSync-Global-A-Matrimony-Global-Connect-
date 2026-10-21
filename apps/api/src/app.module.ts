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

@Module({
  imports: [
    AppConfigModule,
    CryptoModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    TenantsModule,
    PartnerPreferencesModule,
    AuthModule,
    MediaModule,
    BiodataModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
