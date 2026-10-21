import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { BiodataService } from './biodata.service';

@ApiTags('biodata')
@ApiBearerAuth()
@Controller('biodata')
@UseGuards(JwtAuthGuard)
export class BiodataController {
  constructor(private readonly biodataService: BiodataService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get decrypted biodata for the authenticated user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getMine(@Req() request: AuthenticatedJwtRequest): Promise<BiodataMeDto> {
    return this.biodataService.getMine(request.userId!);
  }

  @Patch('me/sections/:sectionId')
  @ApiOperation({ summary: 'Update one biodata section (encrypts sensitive fields at rest)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  patchSection(
    @Req() request: AuthenticatedJwtRequest,
    @Param('sectionId') sectionId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<BiodataMeDto> {
    return this.biodataService.patchSection(request.userId!, sectionId, body);
  }
}
