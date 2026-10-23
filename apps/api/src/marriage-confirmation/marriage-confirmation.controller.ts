import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  CreateMarriageConfirmationDto,
  MarriageConfirmationDto,
  MarriageConfirmationListDto,
} from '@soulsync/shared-types/marriage-confirmation';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { MarriageConfirmationService } from './marriage-confirmation.service';

@ApiTags('marriage-confirmations')
@ApiBearerAuth()
@Controller('marriage-confirmations')
@UseGuards(JwtAuthGuard)
export class MarriageConfirmationController {
  constructor(private readonly service: MarriageConfirmationService) {}

  @Get('me')
  @ApiOperation({ summary: 'List marriage confirmations for the current member' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listMine(@Req() request: AuthenticatedJwtRequest): Promise<MarriageConfirmationListDto> {
    return this.service.listMine(request.userId!);
  }

  @Post()
  @ApiOperation({ summary: 'Request partner confirmation of marriage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  create(
    @Req() request: AuthenticatedJwtRequest,
    @Body() body: CreateMarriageConfirmationDto,
  ): Promise<MarriageConfirmationDto> {
    return this.service.create(request.userId!, body);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a marriage confirmation request' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  accept(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
  ): Promise<MarriageConfirmationDto> {
    return this.service.accept(request.userId!, id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Decline a marriage confirmation request' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  decline(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
  ): Promise<MarriageConfirmationDto> {
    return this.service.decline(request.userId!, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a pending marriage confirmation you sent' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  cancel(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
  ): Promise<MarriageConfirmationDto> {
    return this.service.cancel(request.userId!, id);
  }

  @Post(':id/request-divorce')
  @ApiOperation({ summary: 'Request divorce (spouse must confirm)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  requestDivorce(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
  ): Promise<MarriageConfirmationDto> {
    return this.service.requestDivorce(request.userId!, id);
  }

  @Post(':id/cancel-divorce-request')
  @ApiOperation({ summary: 'Cancel your pending divorce request' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  cancelDivorceRequest(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
  ): Promise<MarriageConfirmationDto> {
    return this.service.cancelDivorceRequest(request.userId!, id);
  }

  @Post(':id/accept-divorce')
  @ApiOperation({ summary: 'Confirm a spouse divorce request' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  acceptDivorce(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
  ): Promise<MarriageConfirmationDto> {
    return this.service.acceptDivorce(request.userId!, id);
  }

  @Post(':id/decline-divorce-request')
  @ApiOperation({ summary: 'Decline a spouse divorce request' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  declineDivorceRequest(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
  ): Promise<MarriageConfirmationDto> {
    return this.service.declineDivorceRequest(request.userId!, id);
  }

  @Post(':id/mark-deceased')
  @ApiOperation({ summary: 'Mark a mutual marriage as deceased' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  markDeceased(
    @Req() request: AuthenticatedJwtRequest,
    @Param('id') id: string,
  ): Promise<MarriageConfirmationDto> {
    return this.service.markDeceased(request.userId!, id);
  }
}
