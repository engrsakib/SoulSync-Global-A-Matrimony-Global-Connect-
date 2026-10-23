-- AlterTable
ALTER TABLE "marriage_confirmations" ALTER COLUMN "partnerUserId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "showMarriagePartnerOnPublicBiodata" BOOLEAN NOT NULL DEFAULT false;
