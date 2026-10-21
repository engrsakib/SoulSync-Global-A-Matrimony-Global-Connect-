-- CreateEnum
CREATE TYPE "IslamMaslak" AS ENUM ('SARSINA', 'DEOBANDI', 'BARELVI', 'TABLIGH', 'AHLE_HADITH_SALAFI', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "islamMaslak" "IslamMaslak";
