import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCommonErrors,
  ApiJsonBody,
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
} from '../common/swagger';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePartnerPreferenceDto } from './dto/create-partner-preference.dto';
import { PartnerPreferenceResponseDto } from './dto/partner-preference-response.dto';
import { UpdatePartnerPreferenceDto } from './dto/update-partner-preference.dto';
import { PartnerPreferencesService } from './partner-preferences.service';

@ApiTags('partner-preferences')
@ApiBearerAuth()
@Controller('partner-preferences')
@UseGuards(JwtAuthGuard)
export class PartnerPreferencesController {
  constructor(private readonly partnerPreferencesService: PartnerPreferencesService) {}

  @Post()
  @ApiOperation({ summary: 'Create or replace partner preferences for the current user' })
  @ApiJsonBody(CreatePartnerPreferenceDto)
  @ApiWrappedCreatedResponse(PartnerPreferenceResponseDto)
  @ApiCommonErrors()
  upsert(
    @CurrentUserId() userId: string,
    @Body() dto: CreatePartnerPreferenceDto,
  ): Promise<PartnerPreferenceResponseDto> {
    return this.partnerPreferencesService.upsertForUser(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get partner preferences for the current user' })
  @ApiWrappedOkResponse(PartnerPreferenceResponseDto)
  @ApiCommonErrors()
  findMine(@CurrentUserId() userId: string): Promise<PartnerPreferenceResponseDto> {
    return this.partnerPreferencesService.findMine(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Partially update partner preferences' })
  @ApiJsonBody(UpdatePartnerPreferenceDto)
  @ApiWrappedOkResponse(PartnerPreferenceResponseDto)
  @ApiCommonErrors()
  updateMine(
    @CurrentUserId() userId: string,
    @Body() dto: UpdatePartnerPreferenceDto,
  ): Promise<PartnerPreferenceResponseDto> {
    return this.partnerPreferencesService.updateForUser(userId, dto);
  }
}
