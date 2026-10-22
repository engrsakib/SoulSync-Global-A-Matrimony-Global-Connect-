import { forwardRef, Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { EmailVerificationModule } from '../email-verification/email-verification.module';
import { MailModule } from '../mail/mail.module';
import { AccountEmailService } from './account-email.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { JwtTokenService } from './jwt.service';
import { LoginCodeService } from './login-code.service';
import { PasswordService } from './password.service';
import { PasswordResetService } from './password-reset.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { CryptoModule } from '../crypto/crypto.module';
import { RedisModule } from '../redis/redis.module';
import { AuthSessionService } from './auth-session.service';

@Module({
  imports: [
    forwardRef(() => MediaModule),
    MailModule,
    EmailVerificationModule,
    CryptoModule,
    RedisModule,
    forwardRef(() => ActivityLogModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountEmailService,
    PasswordResetService,
    PasswordService,
    LoginCodeService,
    JwtTokenService,
    JwtAuthGuard,
    RolesGuard,
    AuthSessionService,
  ],
  exports: [JwtAuthGuard, JwtTokenService, RolesGuard, AuthSessionService],
})
export class AuthModule {}
