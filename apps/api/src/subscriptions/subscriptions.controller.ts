import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  CreateSubscriptionCheckoutIntentRequestDto,
  SubscriptionCatalogDto,
  SubscriptionCheckoutIntentDto,
  ValidateSubscriptionCouponRequestDto,
  ValidateSubscriptionCouponResponseDto,
} from '@soulsync/shared-types/subscription-catalog';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Public subscription plan catalog' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getCatalog(): Promise<SubscriptionCatalogDto> {
    return this.subscriptions.getPublicCatalog();
  }

  @Post('coupons/validate')
  @ApiOperation({ summary: 'Validate a coupon for a plan (no redemption)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  validateCoupon(
    @Body() body: ValidateSubscriptionCouponRequestDto,
  ): Promise<ValidateSubscriptionCouponResponseDto> {
    return this.subscriptions.validateCoupon(body);
  }

  @Post('checkout-intents')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create stub checkout intent (auth required)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  createCheckoutIntent(
    @Req() request: AuthenticatedJwtRequest,
    @Body() body: CreateSubscriptionCheckoutIntentRequestDto,
  ): Promise<SubscriptionCheckoutIntentDto> {
    return this.subscriptions.createCheckoutIntent(request.userId!, body);
  }
}
