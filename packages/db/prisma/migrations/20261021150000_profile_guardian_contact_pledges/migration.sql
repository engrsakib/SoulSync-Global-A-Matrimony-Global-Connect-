-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "guardianName" TEXT,
ADD COLUMN "guardianRelationship" TEXT,
ADD COLUMN "guardianMobile" TEXT,
ADD COLUMN "candidateMobile" TEXT,
ADD COLUMN "marriagePledgeInformationTrue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marriagePledgeGuardianConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marriagePledgeFalseInfoAccountability" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marriagePledgeMarkAfterMarriage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marriagePledgesAcceptedAt" TIMESTAMP(3);
