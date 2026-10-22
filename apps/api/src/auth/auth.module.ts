import { forwardRef, Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { EmailVerificationModule } from '../email-verification/email-verification.module';
import { MailModule } from '../mail/mail.module';
import { AccountEmailService } from './account-email.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from './jwt.service';
import { LoginCodeService } from './login-code.service';
import { PasswordService } from './password.service';
import { PasswordResetService } from './password-reset.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    forwardRef(() => MediaModule),
    MailModule,
    EmailVerificationModule,
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
  ],
  exports: [JwtAuthGuard, JwtTokenService],
})
export class AuthModule {}
