-- CreateTable
CREATE TABLE "marriage_record_archives" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalSlotIndex" INTEGER NOT NULL,
    "spouseRole" "MarriageSpouseRole" NOT NULL,
    "endedStatus" "MarriageRecordStatus" NOT NULL,
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
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marriage_record_archives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marriage_record_archives_userId_archivedAt_idx" ON "marriage_record_archives"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "marriage_record_archives_tenantId_idx" ON "marriage_record_archives"("tenantId");

-- AddForeignKey
ALTER TABLE "marriage_record_archives" ADD CONSTRAINT "marriage_record_archives_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriage_record_archives" ADD CONSTRAINT "marriage_record_archives_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
