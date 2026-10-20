import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule, HealthModule, TenantsModule],
})
export class AppModule {}
