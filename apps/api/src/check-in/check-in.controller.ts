import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CheckInResultDto, CheckInStatusDto } from '@soulsync/shared-types/check-in';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { CheckInService } from './check-in.service';

@ApiTags('check-in')
@ApiBearerAuth()
@Controller('check-in')
@UseGuards(JwtAuthGuard)
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Get('status')
  @ApiOperation({ summary: 'Daily check-in status for the authenticated user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getStatus(@Req() request: AuthenticatedJwtRequest): Promise<CheckInStatusDto> {
    return this.checkInService.getStatus(request.userId!);
  }

  @Post()
  @ApiOperation({ summary: 'Perform daily check-in (once per calendar day in user timezone)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  checkIn(@Req() request: AuthenticatedJwtRequest): Promise<CheckInResultDto> {
    return this.checkInService.checkIn(request.userId!);
  }
}
