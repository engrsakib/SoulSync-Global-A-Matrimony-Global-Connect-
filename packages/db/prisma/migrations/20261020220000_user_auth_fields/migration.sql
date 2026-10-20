-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT,
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "loginCodeFingerprint" TEXT,
ADD COLUMN "loginCodeHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_loginCodeFingerprint_key" ON "users"("loginCodeFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_username_key" ON "users"("tenantId", "username");
