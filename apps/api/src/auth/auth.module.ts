import { Module } from '@nestjs/common';
import { EmailVerificationModule } from '../email-verification/email-verification.module';
import { MailModule } from '../mail/mail.module';
import { AccountEmailService } from './account-email.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from './jwt.service';
import { LoginCodeService } from './login-code.service';
import { PasswordService } from './password.service';

@Module({
  imports: [MailModule, EmailVerificationModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountEmailService,
    PasswordService,
    LoginCodeService,
    JwtTokenService,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, JwtTokenService],
})
export class AuthModule {}
