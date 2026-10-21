-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastCheckInAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "isVisibilityPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN "checkInTimeZone" TEXT;

-- Backfill inactivity flag from listing visibility
UPDATE "profiles" SET "isVisibilityPrivate" = NOT "isDiscoverable";

-- CreateIndex
CREATE INDEX "users_lastCheckInAt_idx" ON "users"("lastCheckInAt");

-- CreateIndex
CREATE INDEX "profiles_isVisibilityPrivate_userId_idx" ON "profiles"("isVisibilityPrivate", "userId");
