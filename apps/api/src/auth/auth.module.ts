import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from './jwt.service';
import { LoginCodeService } from './login-code.service';
import { PasswordService } from './password.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, LoginCodeService, JwtTokenService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtTokenService],
})
export class AuthModule {}
