import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { ProfileResumeDto } from '@soulsync/shared-types';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { ProfileResumeThrottlerGuard } from './profile-resume-throttler.guard';
import { ProfileResumeService } from './profile-resume.service';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
@UseGuards(JwtAuthGuard, ProfileResumeThrottlerGuard)
export class ProfileResumeController {
  constructor(private readonly profileResume: ProfileResumeService) {}

  @Get(':userId/resume')
  @Throttle({ profileResume: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Protected biodata resume (redacted) for a member profile' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getResume(
    @Req() request: AuthenticatedJwtRequest,
    @Param('userId') targetUserId: string,
  ): Promise<ProfileResumeDto> {
    return this.profileResume.getResume(request.userId!, targetUserId);
  }
}
