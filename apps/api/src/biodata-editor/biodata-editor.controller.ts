import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  BiodataEditorGrantDto,
  BiodataEditorGrantEditorListDto,
  BiodataEditorGrantOwnerListDto,
  DecideBiodataEditorGrantDto,
  InviteBiodataEditorDto,
  RequestBiodataEditorAccessDto,
  TenantMemberUsernameSearchDto,
  UpdateBiodataEditorGrantScopeDto,
} from '@soulsync/shared-types/biodata-editor-grant';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { BiodataEditorAccessService } from './biodata-editor-access.service';
import { BiodataEditorGrantService } from './biodata-editor-grant.service';

@ApiTags('biodata')
@ApiBearerAuth()
@Controller('biodata/editor-grants')
@UseGuards(JwtAuthGuard)
export class BiodataEditorController {
  constructor(
    private readonly grantService: BiodataEditorGrantService,
    private readonly accessService: BiodataEditorAccessService,
  ) {}

  @Get('mine-as-owner')
  @ApiOperation({ summary: 'List biodata editor grants for profiles you own' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listAsOwner(@Req() request: AuthenticatedJwtRequest): Promise<BiodataEditorGrantOwnerListDto> {
    return this.grantService.listMineAsOwner(request.userId!);
  }

  @Get('mine-as-editor')
  @ApiOperation({ summary: 'List biodata editor grants where you are the editor' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listAsEditor(@Req() request: AuthenticatedJwtRequest): Promise<BiodataEditorGrantEditorListDto> {
    return this.grantService.listMineAsEditor(request.userId!);
  }

  @Get('member-search')
  @ApiOperation({ summary: 'Search tenant members by username prefix (for invites)' })
  @ApiQuery({ name: 'q', required: false })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  searchMembers(
    @Req() request: AuthenticatedJwtRequest,
    @Query('q') q?: string,
  ): Promise<TenantMemberUsernameSearchDto[]> {
    return this.accessService.searchMembersByUsername(request.userId!, q ?? '');
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a member to edit your biodata' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  invite(
    @Req() request: AuthenticatedJwtRequest,
    @Body() body: InviteBiodataEditorDto,
  ): Promise<BiodataEditorGrantDto> {
    return this.grantService.invite(request.userId!, body);
  }

  @Post('request')
  @ApiOperation({ summary: 'Request permission to edit another member biodata' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  requestAccess(
    @Req() request: AuthenticatedJwtRequest,
    @Body() body: RequestBiodataEditorAccessDto,
  ): Promise<BiodataEditorGrantDto> {
    return this.grantService.requestAccess(request.userId!, body);
  }

  @Post(':id/decide')
  @ApiOperation({ summary: 'Approve, deny, or revoke biodata edit access' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  decide(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
    @Body() body: DecideBiodataEditorGrantDto,
  ): Promise<BiodataEditorGrantDto> {
    return this.grantService.decide(request.userId!, id, body);
  }

  @Patch(':id/scope')
  @ApiOperation({ summary: 'Change scope for an active biodata editor (owner only)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  updateScope(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
    @Body() body: UpdateBiodataEditorGrantScopeDto,
  ): Promise<BiodataEditorGrantDto> {
    return this.grantService.updateScope(request.userId!, id, body);
  }
}
