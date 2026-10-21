-- CreateEnum
CREATE TYPE "FamilyEconomicClass" AS ENUM ('UPPER_CLASS', 'UPPER_MIDDLE_CLASS', 'MIDDLE_CLASS', 'LOWER_MIDDLE_CLASS', 'LOWER_CLASS');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "brotherCount" INTEGER,
ADD COLUMN     "familyEconomicClass" "FamilyEconomicClass",
ADD COLUMN     "familyRelatives" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "fatherIsAlive" BOOLEAN,
ADD COLUMN     "fatherProfession" TEXT,
ADD COLUMN     "motherIsAlive" BOOLEAN,
ADD COLUMN     "motherProfession" TEXT,
ADD COLUMN     "residenceDescription" TEXT,
ADD COLUMN     "sisterCount" INTEGER,
ADD COLUMN     "unclesOccupations" TEXT;
