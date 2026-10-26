import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SubscriptionCheckoutIntentStatus,
  SubscriptionPlanStatus,
  type Prisma,
} from '@soulsync/db';
import {
  isSubscriptionCatalogDto,
  type CreateSubscriptionCheckoutIntentRequestDto,
  type SubscriptionCatalogDto,
  type SubscriptionCheckoutIntentDto,
  type SubscriptionPlanDto,
  type ValidateSubscriptionCouponRequestDto,
  type ValidateSubscriptionCouponResponseDto,
} from '@soulsync/shared-types/subscription-catalog';
import { PrismaService } from '../prisma/prisma.service';
import { loadSubscriptionCatalogPage } from './subscription-catalog-page.loader';
import { RedisService } from '../redis/redis.service';
import { getRedisCachedJson } from '../redis/redis-cached-json';
import { applyCouponToPrice, normalizeCouponCode } from './subscription-coupon.logic';
import { buildCatalogDto, toSubscriptionPlanDto } from './subscription-catalog.mapper';

const CATALOG_CACHE_KEY = 'subscription:catalog:v1';
const CATALOG_LOCK_KEY = 'subscription:catalog:lock:v1';
const CATALOG_TTL_SECONDS = 3600;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async invalidateCatalogCache(): Promise<void> {
    try {
      if (this.redis.client.status === 'wait') {
        await this.redis.client.connect();
      }
      await this.redis.client.del(CATALOG_CACHE_KEY);
    } catch {
      /* degrade */
    }
  }

  private async loadCatalogFromDb(): Promise<SubscriptionCatalogDto> {
    const page = loadSubscriptionCatalogPage();
    const rows = await this.prisma.client.subscriptionPlan.findMany({
      where: { status: SubscriptionPlanStatus.ACTIVE },
      orderBy: [{ interval: 'asc' }, { sortOrder: 'asc' }],
    });
    return buildCatalogDto(page, rows);
  }

  async getPublicCatalog(): Promise<SubscriptionCatalogDto> {
    try {
      if (this.redis.client.status === 'wait') {
        await this.redis.client.connect();
      }
      return await getRedisCachedJson(this.redis.client, {
        cacheKey: CATALOG_CACHE_KEY,
        lockKey: CATALOG_LOCK_KEY,
        cacheTtlSeconds: CATALOG_TTL_SECONDS,
        lockTtlSeconds: 30,
        waitMaxMs: 5000,
        parse: (raw) => {
          try {
            const parsed: unknown = JSON.parse(raw);
            return isSubscriptionCatalogDto(parsed) ? parsed : null;
          } catch {
            return null;
          }
        },
        load: () => this.loadCatalogFromDb(),
      });
    } catch {
      return this.loadCatalogFromDb();
    }
  }

  private async getActivePlanBySlug(slug: string) {
    const plan = await this.prisma.client.subscriptionPlan.findFirst({
      where: { slug, status: SubscriptionPlanStatus.ACTIVE },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async validateCoupon(
    body: ValidateSubscriptionCouponRequestDto,
  ): Promise<ValidateSubscriptionCouponResponseDto> {
    const plan = await this.getActivePlanBySlug(body.planSlug);
    const code = normalizeCouponCode(body.code);
    if (!code) {
      return { valid: false, message: 'Enter a coupon code.' };
    }

    const coupon = await this.prisma.client.subscriptionCoupon.findUnique({
      where: { code },
    });
    if (!coupon) {
      return { valid: false, message: 'Coupon not found.' };
    }

    const planDto = toSubscriptionPlanDto(plan);
    const result = applyCouponToPrice(plan.priceCents, coupon, {
      tier: planDto.tier,
      interval: planDto.interval,
    });

    if (!result.valid) {
      return { valid: false, message: result.message };
    }

    return {
      valid: true,
      message: 'Coupon applied.',
      discountedPriceCents: result.discountedPriceCents,
      discountLabel: result.discountLabel,
    };
  }

  async createCheckoutIntent(
    userId: string,
    body: CreateSubscriptionCheckoutIntentRequestDto,
  ): Promise<SubscriptionCheckoutIntentDto> {
    const plan = await this.getActivePlanBySlug(body.planSlug);
    const planDto = toSubscriptionPlanDto(plan);

    let discountedPriceCents = plan.priceCents;
    let couponCode: string | undefined;
    let discountLabel: string | undefined;

    if (body.couponCode?.trim()) {
      const code = normalizeCouponCode(body.couponCode);
      const coupon = await this.prisma.client.subscriptionCoupon.findUnique({
        where: { code },
      });
      if (!coupon) {
        throw new BadRequestException('Coupon not found');
      }
      const applied = applyCouponToPrice(plan.priceCents, coupon, {
        tier: planDto.tier,
        interval: planDto.interval,
      });
      if (!applied.valid) {
        throw new BadRequestException(applied.message);
      }
      discountedPriceCents = applied.discountedPriceCents;
      discountLabel = applied.discountLabel;
      couponCode = code;

      await this.prisma.client.subscriptionCoupon.update({
        where: { id: coupon.id },
        data: { redemptionCount: { increment: 1 } },
      });
    }

    const metadata: Prisma.InputJsonValue = {
      priceCents: plan.priceCents,
      discountedPriceCents,
      currency: plan.currency,
      discountLabel: discountLabel ?? null,
      stub: true,
    };

    const intent = await this.prisma.client.subscriptionCheckoutIntent.create({
      data: {
        userId,
        planId: plan.id,
        couponCode,
        status: SubscriptionCheckoutIntentStatus.COMPLETED,
        metadata,
      },
    });

    await this.invalidateCatalogCache();

    return {
      intentId: intent.id,
      message: 'Checkout recorded. Payment integration coming soon—you are on the list for this plan.',
      planSlug: plan.slug,
      priceCents: plan.priceCents,
      discountedPriceCents,
      currency: plan.currency,
    };
  }

  async listPlansAdmin(): Promise<SubscriptionPlanDto[]> {
    const rows = await this.prisma.client.subscriptionPlan.findMany({
      orderBy: [{ interval: 'asc' }, { sortOrder: 'asc' }],
    });
    return rows.map(toSubscriptionPlanDto);
  }

  async createPlanAdmin(data: Prisma.SubscriptionPlanCreateInput): Promise<SubscriptionPlanDto> {
    const row = await this.prisma.client.subscriptionPlan.create({ data });
    await this.invalidateCatalogCache();
    return toSubscriptionPlanDto(row);
  }

  async updatePlanAdmin(
    id: string,
    data: Prisma.SubscriptionPlanUpdateInput,
  ): Promise<SubscriptionPlanDto> {
    const row = await this.prisma.client.subscriptionPlan.update({
      where: { id },
      data,
    });
    await this.invalidateCatalogCache();
    return toSubscriptionPlanDto(row);
  }

  async deletePlanAdmin(id: string): Promise<void> {
    await this.prisma.client.subscriptionPlan.update({
      where: { id },
      data: { status: SubscriptionPlanStatus.ARCHIVED },
    });
    await this.invalidateCatalogCache();
  }

  async listCouponsAdmin() {
    return this.prisma.client.subscriptionCoupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCouponAdmin(data: Prisma.SubscriptionCouponCreateInput) {
    const row = await this.prisma.client.subscriptionCoupon.create({
      data: {
        ...data,
        code: normalizeCouponCode(String(data.code)),
      },
    });
    await this.invalidateCatalogCache();
    return row;
  }

  async updateCouponAdmin(id: string, data: Prisma.SubscriptionCouponUpdateInput) {
    const payload = { ...data };
    if (typeof payload.code === 'string') {
      payload.code = normalizeCouponCode(payload.code);
    }
    const row = await this.prisma.client.subscriptionCoupon.update({
      where: { id },
      data: payload,
    });
    await this.invalidateCatalogCache();
    return row;
  }
}
