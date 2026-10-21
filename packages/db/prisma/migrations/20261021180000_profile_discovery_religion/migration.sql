-- CreateEnum
CREATE TYPE "BiodataDiscoveryReligionMode" AS ENUM ('SAME_AS_MINE', 'ALL_RELIGIONS', 'SELECTED_RELIGIONS');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "discoveryReligionMode" "BiodataDiscoveryReligionMode" NOT NULL DEFAULT 'SAME_AS_MINE';
ALTER TABLE "profiles" ADD COLUMN "discoveryReligionAllowList" "Religion"[] DEFAULT ARRAY[]::"Religion"[];
