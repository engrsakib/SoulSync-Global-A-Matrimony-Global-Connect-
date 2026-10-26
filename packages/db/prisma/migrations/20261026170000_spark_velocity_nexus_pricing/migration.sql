-- Migrate SubscriptionTier enum SILVER/GOLD/PLATINUM -> SPARK/VELOCITY/NEXUS
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";

CREATE TYPE "SubscriptionTier" AS ENUM ('SPARK', 'VELOCITY', 'NEXUS');

ALTER TABLE "subscription_plans"
  ALTER COLUMN "tier" TYPE "SubscriptionTier"
  USING (
    CASE "tier"::text
      WHEN 'SILVER' THEN 'SPARK'::"SubscriptionTier"
      WHEN 'GOLD' THEN 'VELOCITY'::"SubscriptionTier"
      WHEN 'PLATINUM' THEN 'NEXUS'::"SubscriptionTier"
      ELSE 'SPARK'::"SubscriptionTier"
    END
  );

ALTER TABLE "subscription_coupons"
  ALTER COLUMN "applicableTier" TYPE "SubscriptionTier"
  USING (
    CASE
      WHEN "applicableTier" IS NULL THEN NULL
      WHEN "applicableTier"::text = 'SILVER' THEN 'SPARK'::"SubscriptionTier"
      WHEN "applicableTier"::text = 'GOLD' THEN 'VELOCITY'::"SubscriptionTier"
      WHEN "applicableTier"::text = 'PLATINUM' THEN 'NEXUS'::"SubscriptionTier"
      ELSE 'SPARK'::"SubscriptionTier"
    END
  );

DROP TYPE "SubscriptionTier_old";

-- Offer vs regular pricing + access validity
ALTER TABLE "subscription_plans" ADD COLUMN "compareAtPriceCents" INTEGER;
ALTER TABLE "subscription_plans" ADD COLUMN "validityDays" INTEGER NOT NULL DEFAULT 30;
