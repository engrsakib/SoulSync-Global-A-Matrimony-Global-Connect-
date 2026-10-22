import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { UserActivityLogListDto } from '@soulsync/shared-types/activity-log';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { ActivityLogService } from './activity-log.service';
import { ListActivityLogQueryDto } from './dto/list-activity-log.query.dto';

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
    @Query() query: ListActivityLogQueryDto,
  ): Promise<UserActivityLogListDto> {
    return this.activityLogService.listForUser(request.userId!, {
      types: query.types,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      q: query.q,
      sort: query.sort,
      cursor: query.cursor,
      limit: query.limit,
    });
  }
}
