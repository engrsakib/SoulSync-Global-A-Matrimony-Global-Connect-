-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "bloodGroup" "BloodGroup",
ADD COLUMN     "chronicConditionsDetail" TEXT,
ADD COLUMN     "hasChronicConditions" BOOLEAN,
ADD COLUMN     "weightKg" INTEGER;
