import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  ConfirmMarriageRecordDto,
  MarriageRecordDto,
  MarriageRecordListDto,
  UpdateMarriageRecordStatusDto,
  UpsertMarriageRecordDraftDto,
} from '@soulsync/shared-types/marriage-record';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { MarriageRecordService } from './marriage-record.service';

@ApiTags('marriage-records')
@ApiBearerAuth()
@Controller('marriage-records')
@UseGuards(JwtAuthGuard)
export class MarriageRecordController {
  constructor(private readonly service: MarriageRecordService) {}

  @Get('me')
  @ApiOperation({ summary: 'List marriage registry records for the current member' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listMine(@Req() request: AuthenticatedJwtRequest): Promise<MarriageRecordListDto> {
    return this.service.listMine(request.userId!);
  }

  @Put('slots/:slotIndex')
  @ApiOperation({ summary: 'Upsert a draft marriage record for a slot' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  upsertDraft(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slotIndex', ParseIntPipe) slotIndex: number,
    @Body() body: UpsertMarriageRecordDraftDto,
  ): Promise<MarriageRecordDto> {
    return this.service.upsertDraft(request.userId!, slotIndex, body);
  }

  @Post('slots/:slotIndex/confirm')
  @ApiOperation({ summary: 'Lock and confirm a marriage record' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  confirmSlot(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slotIndex', ParseIntPipe) slotIndex: number,
    @Body() body: ConfirmMarriageRecordDto,
  ): Promise<MarriageRecordDto> {
    return this.service.confirmSlot(request.userId!, slotIndex, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mark a confirmed marriage as divorced or deceased' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  updateStatus(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
    @Body() body: UpdateMarriageRecordStatusDto,
  ): Promise<MarriageRecordDto> {
    return this.service.updateStatus(request.userId!, id, body);
  }
}
