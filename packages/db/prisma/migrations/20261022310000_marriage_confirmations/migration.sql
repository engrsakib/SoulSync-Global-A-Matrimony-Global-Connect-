-- CreateEnum
CREATE TYPE "MarriageConfirmationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserNotificationType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMATION_REQUEST';
ALTER TYPE "UserNotificationType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMED';

-- AlterEnum
ALTER TYPE "UserActivityType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMATION_SENT';
ALTER TYPE "UserActivityType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMATION_RECEIVED';
ALTER TYPE "UserActivityType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMATION_DECIDED';
ALTER TYPE "UserActivityType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMED';

-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMATION_SENT';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMATION_RECEIVED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMATION_DECIDED';
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'MARRIAGE_CONFIRMED';

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "hasConfirmedMarriage" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "marriage_confirmations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "initiatorUserId" TEXT NOT NULL,
    "partnerUserId" TEXT NOT NULL,
    "marriageDate" DATE NOT NULL,
    "status" "MarriageConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marriage_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marriage_confirmations_initiatorUserId_partnerUserId_marriageDate_key" ON "marriage_confirmations"("initiatorUserId", "partnerUserId", "marriageDate");

-- CreateIndex
CREATE INDEX "marriage_confirmations_partnerUserId_status_idx" ON "marriage_confirmations"("partnerUserId", "status");

-- CreateIndex
CREATE INDEX "marriage_confirmations_initiatorUserId_status_idx" ON "marriage_confirmations"("initiatorUserId", "status");

-- CreateIndex
CREATE INDEX "marriage_confirmations_tenantId_status_idx" ON "marriage_confirmations"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "marriage_confirmations" ADD CONSTRAINT "marriage_confirmations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriage_confirmations" ADD CONSTRAINT "marriage_confirmations_initiatorUserId_fkey" FOREIGN KEY ("initiatorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriage_confirmations" ADD CONSTRAINT "marriage_confirmations_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
