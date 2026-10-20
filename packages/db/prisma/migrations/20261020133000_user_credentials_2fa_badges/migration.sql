-- CreateEnum
CREATE TYPE "PasswordChangeSource" AS ENUM ('INITIAL', 'USER_CHANGE', 'ADMIN_RESET');

-- CreateEnum
CREATE TYPE "UserBadgeType" AS ENUM ('PROFILE_VERIFIED', 'IDENTITY', 'PHONE', 'EMAIL', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "TwoFactorMethod" AS ENUM ('TOTP');

-- CreateTable
CREATE TABLE "user_credentials" (
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "source" "PasswordChangeSource" NOT NULL DEFAULT 'USER_CHANGE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_two_factor" (
    "userId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "method" "TwoFactorMethod" NOT NULL DEFAULT 'TOTP',
    "totpSecretEnc" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_two_factor_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" "UserBadgeType" NOT NULL,
    "isGranted" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- Backfill credentials from users before dropping passwordHash
INSERT INTO "user_credentials" ("userId", "passwordHash", "passwordChangedAt", "createdAt", "updatedAt")
SELECT "id", "passwordHash", "updatedAt", "createdAt", "updatedAt"
FROM "users";

-- Backfill profile verification badges
INSERT INTO "user_badges" ("id", "userId", "badgeType", "isGranted", "verifiedAt", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    p."userId",
    'PROFILE_VERIFIED'::"UserBadgeType",
    true,
    p."verifiedAt",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "profiles" p
WHERE p."verifiedAt" IS NOT NULL;

-- CreateIndex
CREATE INDEX "password_history_userId_createdAt_idx" ON "password_history"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeType_key" ON "user_badges"("userId", "badgeType");

-- CreateIndex
CREATE INDEX "user_badges_userId_isGranted_idx" ON "user_badges"("userId", "isGranted");

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_two_factor" ADD CONSTRAINT "user_two_factor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "verifiedAt";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "passwordHash";

-- Align Gender enum with current schema (MALE, FEMALE only)
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE');
ALTER TABLE "profiles" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "Gender_old";
