import {
  Body,
  Controller,
  Get,
  Param,
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
  LinkPreviewQueryDto,
  MessengerPeerIdentityReportDto,
  MessengerPrivacyDto,
  PublishMessengerKeysDto,
} from './messenger.dto';
import { MessengerService } from './messenger.service';

@ApiTags('messenger')
@ApiBearerAuth()
@Controller('messenger')
@UseGuards(JwtAuthGuard)
export class MessengerController {
  constructor(private readonly messenger: MessengerService) {}

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
}
