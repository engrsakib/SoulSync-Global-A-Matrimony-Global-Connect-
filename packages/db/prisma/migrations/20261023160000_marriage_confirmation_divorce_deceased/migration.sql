-- AlterEnum
ALTER TYPE "MarriageConfirmationStatus" ADD VALUE 'DIVORCED';
ALTER TYPE "MarriageConfirmationStatus" ADD VALUE 'DECEASED';

-- AlterTable
ALTER TABLE "marriage_confirmations" ADD COLUMN "divorceRequestedByUserId" TEXT;
ALTER TABLE "marriage_confirmations" ADD COLUMN "divorceRequestedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "marriage_confirmations" ADD CONSTRAINT "marriage_confirmations_divorceRequestedByUserId_fkey" FOREIGN KEY ("divorceRequestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
