import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CryptoModule } from '../crypto/crypto.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { CompatibilityService } from './compatibility.service';
import { CompatibilitySnapshotLoader } from './compatibility-snapshot.loader';
import { ProfilesCompatibilityController } from './profiles-compatibility.controller';
import { MemberCompatibilityController } from './member-compatibility.controller';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule, CryptoModule],
  controllers: [ProfilesCompatibilityController, MemberCompatibilityController],
  providers: [CompatibilityService, CompatibilitySnapshotLoader],
  exports: [CompatibilityService],
})
export class CompatibilityModule {}
