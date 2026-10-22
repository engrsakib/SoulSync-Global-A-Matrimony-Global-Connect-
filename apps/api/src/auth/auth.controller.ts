import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiCommonErrors,
  ApiJsonBody,
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
  AuthResultResponseDto,
  MessageDataDto,
  PublicUserResponseDto,
  UsernameAvailabilityResponseDto,
} from '../common/swagger';
import { AccountEmailService } from './account-email.service';
import { AuthService } from './auth.service';
import { ConfirmEmailCodeDto } from './dto/confirm-email-code.dto';
import { RequestEmailDto } from './dto/request-email.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UploadAvatarFromUrlDto } from './dto/upload-avatar-from-url.dto';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from './jwt-auth.guard';
import type { UploadedFilePayload } from '../media/media.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountEmailService: AccountEmailService,
  ) {}

  @Get('username/available')
  @ApiTags('auth')
  @ApiOperation({ summary: 'Check if a username is available (public)' })
  @ApiQuery({ name: 'username', required: true, example: 'jane_doe' })
  @ApiWrappedOkResponse(UsernameAvailabilityResponseDto)
  @ApiCommonErrors()
  usernameAvailable(@Query('username') username: string) {
    return this.authService.checkUsernameAvailable(username ?? '');
  }

  @Post('register')
  @ApiTags('auth')
  @ApiOperation({ summary: 'Register a new member account' })
  @ApiJsonBody(RegisterDto)
  @ApiWrappedCreatedResponse(AuthResultResponseDto)
  @ApiCommonErrors()
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiTags('auth')
  @ApiOperation({ summary: 'Login with email/username and password' })
  @ApiJsonBody(LoginDto)
  @ApiWrappedOkResponse(AuthResultResponseDto)
  @ApiCommonErrors()
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('guest')
  @ApiTags('auth')
  @ApiOperation({ summary: 'Create a guest account (returns login code once)' })
  @ApiWrappedCreatedResponse(AuthResultResponseDto)
  @ApiCommonErrors()
  createGuest() {
    return this.authService.createGuest();
  }

  @Post('guest/login')
  @ApiTags('auth')
  @ApiOperation({ summary: 'Login as guest with login code' })
  @ApiJsonBody(GuestLoginDto)
  @ApiWrappedOkResponse(AuthResultResponseDto)
  @ApiCommonErrors()
  guestLogin(@Body() dto: GuestLoginDto) {
    return this.authService.guestLogin(dto);
  }

  @Post('refresh')
  @ApiTags('auth')
  @ApiOperation({ summary: 'Exchange a refresh token for a new access + refresh pair' })
  @ApiJsonBody(RefreshTokenDto)
  @ApiWrappedOkResponse(AuthResultResponseDto)
  @ApiCommonErrors()
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshSession(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiTags('account')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiWrappedOkResponse(PublicUserResponseDto)
  @ApiCommonErrors()
  me(@Req() request: AuthenticatedJwtRequest) {
    return this.authService.getMe(request.userId!);
  }

  @Get('me/username/available')
  @UseGuards(JwtAuthGuard)
  @ApiTags('account')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Check username availability for the current user' })
  @ApiQuery({ name: 'username', required: true, example: 'jane_doe' })
  @ApiWrappedOkResponse(UsernameAvailabilityResponseDto)
  @ApiCommonErrors()
  meUsernameAvailable(
    @Req() request: AuthenticatedJwtRequest,
    @Query('username') username: string,
  ) {
    return this.authService.checkUsernameAvailable(username ?? '', request.userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiTags('account')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Update profile names' })
  @ApiJsonBody(UpdateProfileDto)
  @ApiWrappedOkResponse(PublicUserResponseDto)
  @ApiCommonErrors()
  updateProfile(@Req() request: AuthenticatedJwtRequest, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(request.userId!, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiTags('account')
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Upload profile avatar',
    description: 'JPEG or PNG up to 5MB. Updates the current user avatar URL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG or PNG (max 5MB)',
        },
      },
    },
  })
  @ApiWrappedOkResponse(PublicUserResponseDto)
  @ApiCommonErrors()
  uploadAvatar(
    @Req() request: AuthenticatedJwtRequest,
    @UploadedFile() file: UploadedFilePayload | undefined,
  ) {
    return this.authService.uploadAvatar(request.userId!, file!);
  }

  @Post('me/avatar/from-url')
  @UseGuards(JwtAuthGuard)
  @ApiTags('account')
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Set profile avatar from HTTPS image URL',
    description: 'Cloudinary fetches the image server-side. JPEG or PNG up to 5MB.',
  })
  @ApiJsonBody(UploadAvatarFromUrlDto)
  @ApiWrappedOkResponse(PublicUserResponseDto)
  @ApiCommonErrors()
  uploadAvatarFromUrl(
    @Req() request: AuthenticatedJwtRequest,
    @Body() dto: UploadAvatarFromUrlDto,
  ) {
    return this.authService.uploadAvatarFromUrl(request.userId!, dto.url);
  }

  @Patch('me/username')
  @UseGuards(JwtAuthGuard)
  @ApiTags('account')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Change username' })
  @ApiJsonBody(UpdateUsernameDto)
  @ApiWrappedOkResponse(PublicUserResponseDto)
  @ApiCommonErrors()
  updateUsername(@Req() request: AuthenticatedJwtRequest, @Body() dto: UpdateUsernameDto) {
    return this.authService.updateUsername(request.userId!, dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiTags('account')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Set or change password' })
  @ApiJsonBody(ChangePasswordDto)
  @ApiWrappedOkResponse(PublicUserResponseDto)
  @ApiCommonErrors()
  changePassword(@Req() request: AuthenticatedJwtRequest, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(request.userId!, dto);
  }

  @Post('me/email/set/request')
  @UseGuards(JwtAuthGuard)
  @ApiTags('email')
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Request verification code to set email',
    description:
      'Sends a 6-digit code (5 minute TTL) for first-time email setup or verifying an unverified address.',
  })
  @ApiJsonBody(RequestEmailDto)
  @ApiWrappedOkResponse(MessageDataDto)
  @ApiCommonErrors()
  requestSetEmail(@Req() request: AuthenticatedJwtRequest, @Body() dto: RequestEmailDto) {
    return this.accountEmailService.requestSetEmail(request.userId!, dto.email);
  }

  @Post('me/email/set/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiTags('email')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Confirm set email with verification code' })
  @ApiJsonBody(ConfirmEmailCodeDto)
  @ApiWrappedOkResponse(PublicUserResponseDto)
  @ApiCommonErrors()
  confirmSetEmail(@Req() request: AuthenticatedJwtRequest, @Body() dto: ConfirmEmailCodeDto) {
    return this.accountEmailService.confirmSetEmail(request.userId!, dto.email, dto.code);
  }

  @Post('me/email/change/request-current')
  @UseGuards(JwtAuthGuard)
  @ApiTags('email')
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Send verification code to current email',
    description: 'First step of change-email flow. Requires a verified non-placeholder email.',
  })
  @ApiWrappedOkResponse(MessageDataDto)
  @ApiCommonErrors()
  requestChangeCurrentEmail(@Req() request: AuthenticatedJwtRequest) {
    return this.accountEmailService.requestChangeCurrentEmail(request.userId!);
  }

  @Post('me/email/change/verify-current')
  @UseGuards(JwtAuthGuard)
  @ApiTags('email')
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Verify current email with code',
    description: 'Opens a 15-minute window to verify the new email address.',
  })
  @ApiJsonBody(VerifyEmailCodeDto)
  @ApiWrappedOkResponse(MessageDataDto)
  @ApiCommonErrors()
  verifyChangeCurrentEmail(
    @Req() request: AuthenticatedJwtRequest,
    @Body() dto: VerifyEmailCodeDto,
  ) {
    return this.accountEmailService.verifyChangeCurrentEmail(request.userId!, dto.code);
  }

  @Post('me/email/change/request-new')
  @UseGuards(JwtAuthGuard)
  @ApiTags('email')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Send verification code to new email address' })
  @ApiJsonBody(RequestEmailDto)
  @ApiWrappedOkResponse(MessageDataDto)
  @ApiCommonErrors()
  requestChangeNewEmail(@Req() request: AuthenticatedJwtRequest, @Body() dto: RequestEmailDto) {
    return this.accountEmailService.requestChangeNewEmail(request.userId!, dto.email);
  }

  @Post('me/email/change/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiTags('email')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Confirm new email with verification code' })
  @ApiJsonBody(ConfirmEmailCodeDto)
  @ApiWrappedOkResponse(PublicUserResponseDto)
  @ApiCommonErrors()
  confirmChangeNewEmail(@Req() request: AuthenticatedJwtRequest, @Body() dto: ConfirmEmailCodeDto) {
    return this.accountEmailService.confirmChangeNewEmail(request.userId!, dto.email, dto.code);
  }
}
