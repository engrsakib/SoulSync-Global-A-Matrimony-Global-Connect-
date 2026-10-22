import { Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  UserNotificationDto,
  UserNotificationListDto,
} from '@soulsync/shared-types/notifications';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List in-app notifications for the current user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  list(
    @Req() request: AuthenticatedJwtRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<UserNotificationListDto> {
    const parsedLimit = limit !== undefined ? Number.parseInt(limit, 10) : undefined;
    return this.notificationsService.listForUser(
      request.userId!,
      cursor,
      Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  markRead(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
  ): Promise<UserNotificationDto> {
    return this.notificationsService.markRead(request.userId!, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  markAllRead(@Req() request: AuthenticatedJwtRequest): Promise<{ updated: number }> {
    return this.notificationsService.markAllRead(request.userId!);
  }
}
