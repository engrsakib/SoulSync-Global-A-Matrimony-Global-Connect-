-- CreateEnum
CREATE TYPE "MarriageRecordStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'DIVORCED', 'DECEASED');

-- CreateEnum
CREATE TYPE "MarriageSpouseRole" AS ENUM ('WIFE', 'HUSBAND');

-- CreateTable
CREATE TABLE "marriage_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "spouseRole" "MarriageSpouseRole" NOT NULL,
    "status" "MarriageRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "marriageDate" DATE,
    "lockedAt" TIMESTAMP(3),
    "spouseNameEnc" TEXT,
    "spousePhoneEnc" TEXT,
    "spouseTelegramEnc" TEXT,
    "spouseWhatsAppEnc" TEXT,
    "childrenEnc" JSONB,
    "linkedPartnerUserId" TEXT,
    "partnerUsernameHint" TEXT,
    "marriageConfirmationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marriage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marriage_records_userId_slotIndex_key" ON "marriage_records"("userId", "slotIndex");

-- CreateIndex
CREATE INDEX "marriage_records_userId_status_idx" ON "marriage_records"("userId", "status");

-- CreateIndex
CREATE INDEX "marriage_records_tenantId_status_idx" ON "marriage_records"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "marriage_records" ADD CONSTRAINT "marriage_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriage_records" ADD CONSTRAINT "marriage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriage_records" ADD CONSTRAINT "marriage_records_marriageConfirmationId_fkey" FOREIGN KEY ("marriageConfirmationId") REFERENCES "marriage_confirmations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
