import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ProfileCompatibilityDto } from '@soulsync/shared-types/compatibility';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { CompatibilityService } from './compatibility.service';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesCompatibilityController {
  constructor(private readonly compatibility: CompatibilityService) {}

  @Get(':userId/compatibility')
  @ApiOperation({ summary: 'Compatibility score vs another member (viewer-centric)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getCompatibility(
    @Req() request: AuthenticatedJwtRequest,
    @Param('userId') targetUserId: string,
  ): Promise<ProfileCompatibilityDto> {
    return this.compatibility.getCompatibility(request.userId!, targetUserId);
  }
}
