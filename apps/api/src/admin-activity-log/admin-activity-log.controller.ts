import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuditEventListDto } from '@soulsync/shared-types/audit-log';
import { UserRole } from '@soulsync/db';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminActivityLogService } from './admin-activity-log.service';

@ApiTags('admin-activity-log')
@ApiBearerAuth()
@Controller('admin/activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
export class AdminActivityLogController {
  constructor(private readonly adminActivityLogService: AdminActivityLogService) {}

  @Get()
  @ApiOperation({ summary: 'List audit events (admin)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  list(
    @Req() request: AuthenticatedJwtRequest,
    @Query('actorId') actorId?: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('tenantId') tenantId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<AuditEventListDto> {
    const parsedLimit = limit !== undefined ? Number.parseInt(limit, 10) : undefined;
    return this.adminActivityLogService.listForAdmin(
      request.userRole ?? request.jwtPayload!.role,
      request.tenantId ?? request.jwtPayload!.tenantId,
      {
        actorId,
        targetUserId,
        type: type as never,
        status: status as never,
        dateFrom,
        dateTo,
        tenantId,
        cursor,
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      },
    );
  }

  @Get('user/:userId/timeline')
  @ApiOperation({ summary: 'Audit timeline for actions by or on a user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  userTimeline(
    @Req() request: AuthenticatedJwtRequest,
    @Param('userId') userId: string,
    @Query('otherUserId') otherUserId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('tenantId') tenantId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<AuditEventListDto> {
    const parsedLimit = limit !== undefined ? Number.parseInt(limit, 10) : undefined;
    return this.adminActivityLogService.timelineForUser(
      request.userRole ?? request.jwtPayload!.role,
      request.tenantId ?? request.jwtPayload!.tenantId,
      userId,
      {
        otherUserId,
        type: type as never,
        status: status as never,
        dateFrom,
        dateTo,
        tenantId,
        cursor,
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      },
    );
  }
}
