import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  CreditTransactionListDto,
  CreditWalletSummaryDto,
} from '@soulsync/shared-types/credits';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('wallet')
  @ApiOperation({ summary: 'Credit wallet summary for the authenticated user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getSummary(@Req() request: AuthenticatedJwtRequest): Promise<CreditWalletSummaryDto> {
    return this.walletService.getSummary(request.userId!);
  }

  @Get('wallet/transactions')
  @ApiOperation({ summary: 'Paginated credit transaction history' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listTransactions(
    @Req() request: AuthenticatedJwtRequest,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<CreditTransactionListDto> {
    const parsedLimit = limit !== undefined ? Number.parseInt(limit, 10) : undefined;
    return this.walletService.listTransactions(request.userId!, {
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      cursor,
    });
  }
}
