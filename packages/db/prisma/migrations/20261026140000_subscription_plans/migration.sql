-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "SubscriptionBillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionPlanStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionCouponDiscountType" AS ENUM ('PERCENT', 'FIXED_CENTS');

-- CreateEnum
CREATE TYPE "SubscriptionCheckoutIntentStatus" AS ENUM ('CREATED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "interval" "SubscriptionBillingInterval" NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL DEFAULT '[]',
    "status" "SubscriptionPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "SubscriptionCouponDiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "applicableTier" "SubscriptionTier",
    "applicableInterval" "SubscriptionBillingInterval",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_checkout_intents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "couponCode" TEXT,
    "status" "SubscriptionCheckoutIntentStatus" NOT NULL DEFAULT 'CREATED',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_checkout_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "subscription_plans_status_interval_sortOrder_idx" ON "subscription_plans"("status", "interval", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_coupons_code_key" ON "subscription_coupons"("code");

-- CreateIndex
CREATE INDEX "subscription_checkout_intents_userId_createdAt_idx" ON "subscription_checkout_intents"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "subscription_checkout_intents_planId_idx" ON "subscription_checkout_intents"("planId");

-- AddForeignKey
ALTER TABLE "subscription_checkout_intents" ADD CONSTRAINT "subscription_checkout_intents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_checkout_intents" ADD CONSTRAINT "subscription_checkout_intents_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
