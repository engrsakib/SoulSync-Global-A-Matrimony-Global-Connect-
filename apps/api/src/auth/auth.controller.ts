import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountEmailService } from './account-email.service';
import { AuthService } from './auth.service';
import { ConfirmEmailCodeDto } from './dto/confirm-email-code.dto';
import { RequestEmailDto } from './dto/request-email.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountEmailService: AccountEmailService,
  ) {}

  @Get('username/available')
  usernameAvailable(@Query('username') username: string) {
    return this.authService.checkUsernameAvailable(username ?? '');
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('guest')
  createGuest() {
    return this.authService.createGuest();
  }

  @Post('guest/login')
  guestLogin(@Body() dto: GuestLoginDto) {
    return this.authService.guestLogin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Req() request: AuthenticatedJwtRequest) {
    return this.authService.getMe(request.userId!);
  }

  @Get('me/username/available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  meUsernameAvailable(
    @Req() request: AuthenticatedJwtRequest,
    @Query('username') username: string,
  ) {
    return this.authService.checkUsernameAvailable(username ?? '', request.userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProfile(@Req() request: AuthenticatedJwtRequest, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(request.userId!, dto);
  }

  @Patch('me/username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateUsername(@Req() request: AuthenticatedJwtRequest, @Body() dto: UpdateUsernameDto) {
    return this.authService.updateUsername(request.userId!, dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changePassword(@Req() request: AuthenticatedJwtRequest, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(request.userId!, dto);
  }

  @Post('me/email/set/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  requestSetEmail(@Req() request: AuthenticatedJwtRequest, @Body() dto: RequestEmailDto) {
    return this.accountEmailService.requestSetEmail(request.userId!, dto.email);
  }

  @Post('me/email/set/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  confirmSetEmail(@Req() request: AuthenticatedJwtRequest, @Body() dto: ConfirmEmailCodeDto) {
    return this.accountEmailService.confirmSetEmail(request.userId!, dto.email, dto.code);
  }

  @Post('me/email/change/request-current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  requestChangeCurrentEmail(@Req() request: AuthenticatedJwtRequest) {
    return this.accountEmailService.requestChangeCurrentEmail(request.userId!);
  }

  @Post('me/email/change/verify-current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  verifyChangeCurrentEmail(
    @Req() request: AuthenticatedJwtRequest,
    @Body() dto: VerifyEmailCodeDto,
  ) {
    return this.accountEmailService.verifyChangeCurrentEmail(request.userId!, dto.code);
  }

  @Post('me/email/change/request-new')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  requestChangeNewEmail(@Req() request: AuthenticatedJwtRequest, @Body() dto: RequestEmailDto) {
    return this.accountEmailService.requestChangeNewEmail(request.userId!, dto.email);
  }

  @Post('me/email/change/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  confirmChangeNewEmail(@Req() request: AuthenticatedJwtRequest, @Body() dto: ConfirmEmailCodeDto) {
    return this.accountEmailService.confirmChangeNewEmail(request.userId!, dto.email, dto.code);
  }
}
