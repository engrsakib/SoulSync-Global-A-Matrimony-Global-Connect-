import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors, ApiJsonBody, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import {
  CreateMessengerConversationDto,
  CreateMessengerScheduledMessageDto,
  GiphySearchQueryDto,
  LinkPreviewQueryDto,
  MessengerPeerIdentityReportDto,
  MessengerPrivacyDto,
  PublishMessengerKeysDto,
  SendMessengerMessageDto,
  UpdateMessengerScheduledMessageDto,
} from './messenger.dto';
import { MessengerGiphyService } from './messenger-giphy.service';
import { MessengerScheduledService } from './messenger-scheduled.service';
import { MessengerService } from './messenger.service';

@ApiTags('messenger')
@ApiBearerAuth()
@Controller('messenger')
@UseGuards(JwtAuthGuard)
export class MessengerController {
  constructor(
    private readonly messenger: MessengerService,
    private readonly scheduled: MessengerScheduledService,
    private readonly giphy: MessengerGiphyService,
  ) {}

  @Post('socket-ticket')
  @ApiOperation({ summary: 'Issue short-lived Socket.io auth ticket' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  createSocketTicket(@Req() request: AuthenticatedJwtRequest) {
    return this.messenger.createSocketTicket({
      sub: request.userId!,
      tenantId: request.tenantId!,
      role: request.userRole!,
      sid: request.jwtPayload?.sid,
    });
  }

  @Put('keys')
  @ApiOperation({ summary: 'Publish E2EE public key bundle' })
  @ApiJsonBody(PublishMessengerKeysDto)
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async publishKeys(@Req() request: AuthenticatedJwtRequest, @Body() body: PublishMessengerKeysDto) {
    await this.messenger.publishKeys(request.userId!, request.tenantId!, body);
    return { ok: true };
  }

  @Get('keys/:userId')
  @ApiOperation({ summary: 'Fetch peer public key bundle' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getKeys(@Req() request: AuthenticatedJwtRequest, @Param('userId') userId: string) {
    return this.messenger.getKeyBundle(userId, request.tenantId!);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List messenger conversations' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listConversations(@Req() request: AuthenticatedJwtRequest) {
    return this.messenger.listConversations(request.userId!, request.tenantId!);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Open conversation by username' })
  @ApiJsonBody(CreateMessengerConversationDto)
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  createConversation(
    @Req() request: AuthenticatedJwtRequest,
    @Body() body: CreateMessengerConversationDto,
  ) {
    return this.messenger.createConversation(request.userId!, request.tenantId!, body);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send encrypted message (REST fallback)' })
  @ApiJsonBody(SendMessengerMessageDto)
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  sendMessage(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
    @Body() body: SendMessengerMessageDto,
  ) {
    return this.messenger.handleSendMessage(request.userId!, {
      conversationId: id,
      ciphertext: body.ciphertext,
      nonce: body.nonce,
      header: body.header,
    });
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Paginated encrypted message history' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getMessages(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? Number.parseInt(limit, 10) : undefined;
    return this.messenger.getMessages(request.userId!, id, cursor, parsed);
  }

  @Post('requests/:id/accept')
  @ApiOperation({ summary: 'Accept message request into inbox' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async acceptRequest(@Req() request: AuthenticatedJwtRequest, @Param('id') id: string) {
    await this.messenger.acceptRequest(request.userId!, id);
    return { ok: true };
  }

  @Post('privacy')
  @ApiOperation({ summary: 'Block, restrict, or clear privacy for a user' })
  @ApiJsonBody(MessengerPrivacyDto)
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async setPrivacy(@Req() request: AuthenticatedJwtRequest, @Body() body: MessengerPrivacyDto) {
    await this.messenger.setPrivacy(request.userId!, request.tenantId!, body);
    return { ok: true };
  }

  @Post('peer-identity')
  @ApiOperation({ summary: 'Report peer identity fingerprint (security code)' })
  @ApiJsonBody(MessengerPeerIdentityReportDto)
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  reportIdentity(@Req() request: AuthenticatedJwtRequest, @Body() body: MessengerPeerIdentityReportDto) {
    return this.messenger.reportPeerIdentity(request.userId!, request.tenantId!, body);
  }

  @Get('link-preview')
  @ApiOperation({ summary: 'Fetch Open Graph link preview (SSRF-safe)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  linkPreview(@Query() query: LinkPreviewQueryDto) {
    return this.messenger.getLinkPreview(query.url);
  }

  @Get('giphy/search')
  @ApiOperation({ summary: 'Search Giphy for messenger GIF picker' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  giphySearch(@Query() query: GiphySearchQueryDto) {
    return this.giphy.search(query.q ?? '');
  }

  @Get('giphy/trending')
  @ApiOperation({ summary: 'Trending Giphy GIFs for messenger picker (max 12)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  giphyTrending() {
    return this.giphy.trending();
  }

  @Get('conversations/:id/scheduled')
  @ApiOperation({ summary: 'List scheduled messages for a conversation' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listScheduled(@Req() request: AuthenticatedJwtRequest, @Param('id') id: string) {
    return this.scheduled.listForConversation(request.userId!, request.tenantId!, id);
  }

  @Post('conversations/:id/scheduled')
  @ApiOperation({ summary: 'Schedule a message' })
  @ApiJsonBody(CreateMessengerScheduledMessageDto)
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  createScheduled(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
    @Body() body: CreateMessengerScheduledMessageDto,
  ) {
    return this.scheduled.create(request.userId!, request.tenantId!, id, body);
  }

  @Get('scheduled/:scheduleId')
  @ApiOperation({ summary: 'Get scheduled message for delivery (sender only)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getScheduled(@Req() request: AuthenticatedJwtRequest, @Param('scheduleId') scheduleId: string) {
    return this.scheduled.getForSender(request.userId!, request.tenantId!, scheduleId);
  }

  @Patch('scheduled/:scheduleId')
  @ApiOperation({ summary: 'Update or reschedule a message' })
  @ApiJsonBody(UpdateMessengerScheduledMessageDto)
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  updateScheduled(
    @Req() request: AuthenticatedJwtRequest,
    @Param('scheduleId') scheduleId: string,
    @Body() body: UpdateMessengerScheduledMessageDto,
  ) {
    return this.scheduled.update(request.userId!, request.tenantId!, scheduleId, body);
  }

  @Post('scheduled/:scheduleId/sent')
  @ApiOperation({ summary: 'Mark scheduled message as sent after client delivery' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async markScheduledSent(
    @Req() request: AuthenticatedJwtRequest,
    @Param('scheduleId') scheduleId: string,
  ) {
    await this.scheduled.markSent(request.userId!, request.tenantId!, scheduleId);
    return { ok: true };
  }

  @Delete('scheduled/:scheduleId')
  @ApiOperation({ summary: 'Cancel a scheduled message' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async cancelScheduled(
    @Req() request: AuthenticatedJwtRequest,
    @Param('scheduleId') scheduleId: string,
  ) {
    await this.scheduled.cancel(request.userId!, request.tenantId!, scheduleId);
    return { ok: true };
  }
}
