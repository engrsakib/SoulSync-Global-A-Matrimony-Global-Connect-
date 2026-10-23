-- AlterTable
ALTER TABLE "marriage_confirmations" ALTER COLUMN "partnerUserId" DROP NOT NULL;

-- One self-declared confirmed marriage per initiator + date (no linked partner)
CREATE UNIQUE INDEX "marriage_confirmations_initiator_solo_date_key"
ON "marriage_confirmations" ("initiatorUserId", "marriageDate")
WHERE "partnerUserId" IS NULL AND "status" = 'CONFIRMED';
