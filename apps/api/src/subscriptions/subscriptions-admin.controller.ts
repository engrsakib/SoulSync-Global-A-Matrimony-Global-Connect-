import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole, type Prisma } from '@soulsync/db';
import type { SubscriptionPlanDto } from '@soulsync/shared-types/subscription-catalog';
import { ApiCommonErrors, ApiWrappedOkArrayResponse, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('admin-subscriptions')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SubscriptionsAdminController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('subscription-plans')
  @ApiOperation({ summary: 'List subscription plans (super admin)' })
  @ApiWrappedOkArrayResponse(Object)
  @ApiCommonErrors()
  listPlans(): Promise<SubscriptionPlanDto[]> {
    return this.subscriptions.listPlansAdmin();
  }

  @Post('subscription-plans')
  @ApiOperation({ summary: 'Create subscription plan' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  createPlan(@Body() body: Prisma.SubscriptionPlanCreateInput): Promise<SubscriptionPlanDto> {
    return this.subscriptions.createPlanAdmin(body);
  }

  @Patch('subscription-plans/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  updatePlan(
    @Param('id') id: string,
    @Body() body: Prisma.SubscriptionPlanUpdateInput,
  ): Promise<SubscriptionPlanDto> {
    return this.subscriptions.updatePlanAdmin(id, body);
  }

  @Delete('subscription-plans/:id')
  @ApiOperation({ summary: 'Archive subscription plan' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async deletePlan(@Param('id') id: string): Promise<{ ok: true }> {
    await this.subscriptions.deletePlanAdmin(id);
    return { ok: true };
  }

  @Get('subscription-coupons')
  @ApiOperation({ summary: 'List subscription coupons' })
  @ApiWrappedOkArrayResponse(Object)
  @ApiCommonErrors()
  listCoupons() {
    return this.subscriptions.listCouponsAdmin();
  }

  @Post('subscription-coupons')
  @ApiOperation({ summary: 'Create subscription coupon' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  createCoupon(@Body() body: Prisma.SubscriptionCouponCreateInput) {
    return this.subscriptions.createCouponAdmin(body);
  }

  @Patch('subscription-coupons/:id')
  @ApiOperation({ summary: 'Update subscription coupon' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  updateCoupon(@Param('id') id: string, @Body() body: Prisma.SubscriptionCouponUpdateInput) {
    return this.subscriptions.updateCouponAdmin(id, body);
  }
}
