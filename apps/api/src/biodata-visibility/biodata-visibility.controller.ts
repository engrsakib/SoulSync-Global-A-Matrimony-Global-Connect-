import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  BiodataAccessRequestDto,
  BiodataAccessRequestListDto,
  BiodataVisibilityPatchDto,
  BiodataVisibilityPolicyDto,
  CreateBiodataAccessRequestDto,
  DecideBiodataAccessRequestDto,
} from '@soulsync/shared-types/biodata-visibility';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { BiodataVisibilityService } from './biodata-visibility.service';

@ApiTags('biodata')
@ApiBearerAuth()
@Controller('biodata')
@UseGuards(JwtAuthGuard)
export class BiodataVisibilityController {
  constructor(private readonly biodataVisibilityService: BiodataVisibilityService) {}

  @Get('visibility')
  @ApiOperation({ summary: 'Get section visibility policy for the authenticated user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getVisibility(@Req() request: AuthenticatedJwtRequest): Promise<BiodataVisibilityPolicyDto> {
    return this.biodataVisibilityService.getVisibilityPolicy(request.userId!);
  }

  @Patch('visibility')
  @ApiOperation({ summary: 'Update section visibility modes' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  patchVisibility(
    @Req() request: AuthenticatedJwtRequest,
    @Body() body: BiodataVisibilityPatchDto,
  ): Promise<BiodataVisibilityPolicyDto> {
    return this.biodataVisibilityService.patchVisibilityPolicy(request.userId!, body);
  }

  @Get('access-requests')
  @ApiOperation({ summary: 'List access requests for biodata owned by the authenticated user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listAccessRequests(
    @Req() request: AuthenticatedJwtRequest,
    @Query('includeHistory') includeHistory?: string,
  ): Promise<BiodataAccessRequestListDto> {
    return this.biodataVisibilityService.listAccessRequests(request.userId!, {
      includeHistory: includeHistory !== 'false',
    });
  }

  @Post('access-requests')
  @ApiOperation({ summary: 'Request access to a biodata section owned by another member' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  createAccessRequest(
    @Req() request: AuthenticatedJwtRequest,
    @Body() body: CreateBiodataAccessRequestDto,
  ): Promise<BiodataAccessRequestDto> {
    return this.biodataVisibilityService.createAccessRequest(request.userId!, body);
  }

  @Post('access-requests/:id/decide')
  @ApiOperation({ summary: 'Approve, deny, or revoke a biodata access request' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  decideAccessRequest(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
    @Body() body: DecideBiodataAccessRequestDto,
  ): Promise<BiodataAccessRequestDto> {
    return this.biodataVisibilityService.decideAccessRequest(request.userId!, id, body);
  }
}
