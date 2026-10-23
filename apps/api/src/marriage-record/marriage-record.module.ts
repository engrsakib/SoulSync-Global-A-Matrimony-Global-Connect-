import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CryptoModule } from '../crypto/crypto.module';
import { MarriageConfirmationModule } from '../marriage-confirmation/marriage-confirmation.module';
import { MarriageRecordController } from './marriage-record.controller';
import { MarriageRecordService } from './marriage-record.service';

@Module({
  imports: [AuthModule, CryptoModule, forwardRef(() => MarriageConfirmationModule)],
  controllers: [MarriageRecordController],
  providers: [MarriageRecordService],
  exports: [MarriageRecordService],
})
export class MarriageRecordModule {}
