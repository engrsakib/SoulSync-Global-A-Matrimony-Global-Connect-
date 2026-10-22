import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { UserActivityLogListDto } from '@soulsync/shared-types/activity-log';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { ActivityLogService } from './activity-log.service';

@ApiTags('activity-log')
@ApiBearerAuth()
@Controller('activity-log')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @ApiOperation({ summary: 'List activity log entries for the current user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  list(
    @Req() request: AuthenticatedJwtRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<UserActivityLogListDto> {
    const parsedLimit = limit !== undefined ? Number.parseInt(limit, 10) : undefined;
    return this.activityLogService.listForUser(
      request.userId!,
      cursor,
      Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    );
  }
}
