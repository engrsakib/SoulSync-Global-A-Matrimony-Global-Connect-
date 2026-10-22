import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ProfileCompatibilityDto } from '@soulsync/shared-types/compatibility';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { CompatibilityService } from './compatibility.service';

@ApiTags('biodata')
@ApiBearerAuth()
@Controller('biodata/members')
@UseGuards(JwtAuthGuard)
export class MemberCompatibilityController {
  constructor(private readonly compatibility: CompatibilityService) {}

  @Get(':username/compatibility')
  @ApiOperation({ summary: 'Compatibility score for a member by username' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getByUsername(
    @Req() request: AuthenticatedJwtRequest,
    @Param('username') username: string,
  ): Promise<ProfileCompatibilityDto> {
    return this.compatibility.getCompatibilityByUsername(request.userId!, username);
  }
}
