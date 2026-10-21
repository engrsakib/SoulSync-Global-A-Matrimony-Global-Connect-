-- CreateEnum
CREATE TYPE "PrayerRegularity" AS ENUM ('REGULAR_FIVE_TIMES', 'NOT_REGULAR');

-- CreateEnum
CREATE TYPE "SunnahBeardStatus" AS ENUM ('KEEPS_BEARD', 'NOT_REGULAR_YET');

-- CreateEnum
CREATE TYPE "QuranRecitationLevel" AS ENUM ('WITH_TAJWEED', 'IMPROVING', 'PARTIAL', 'LEARNING', 'NOT_YET');

-- CreateEnum
CREATE TYPE "ClothingAboveAnkles" AS ENUM ('ALWAYS', 'MOSTLY', 'SOMETIMES', 'NO');

-- CreateEnum
CREATE TYPE "MahramCompliance" AS ENUM ('STRICT', 'TRY_MY_BEST', 'STILL_LEARNING', 'NO');

-- CreateEnum
CREATE TYPE "HijabPurdah" AS ENUM ('FULL_NIQAB', 'BURQA_HIJAB', 'MODEST_CLOTHING', 'NOT_APPLICABLE');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "aqeedahNotes" TEXT,
ADD COLUMN     "beardDetails" TEXT,
ADD COLUMN     "clothingAboveAnkles" "ClothingAboveAnkles",
ADD COLUMN     "dawahInvolvement" TEXT,
ADD COLUMN     "entertainmentHabits" TEXT,
ADD COLUMN     "favoriteIslamicBooks" TEXT,
ADD COLUMN     "favoriteScholars" TEXT,
ADD COLUMN     "hijabPurdah" "HijabPurdah",
ADD COLUMN     "incomeFullyHalal" BOOLEAN,
ADD COLUMN     "mahramCompliance" "MahramCompliance",
ADD COLUMN     "missedFardPrayersNotes" TEXT,
ADD COLUMN     "prayerRegularity" "PrayerRegularity",
ADD COLUMN     "quranHifzNotes" TEXT,
ADD COLUMN     "quranRecitationLevel" "QuranRecitationLevel",
ADD COLUMN     "sunnahBeardStatus" "SunnahBeardStatus",
ADD COLUMN     "usualOutdoorClothing" TEXT;
