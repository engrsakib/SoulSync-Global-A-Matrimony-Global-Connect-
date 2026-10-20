-- CreateEnum
CREATE TYPE "ComplexionPreference" AS ENUM ('FAIR', 'VERY_FAIR', 'WHEATISH', 'DARK', 'ANY');

-- CreateEnum
CREATE TYPE "EducationPreference" AS ENUM ('SECONDARY', 'HSC', 'GRADUATION', 'POST_GRADUATION', 'MADRASAH', 'PROFESSIONAL', 'ANY');

-- CreateEnum
CREATE TYPE "OccupationPreference" AS ENUM ('SOFTWARE_ENGINEER', 'BUSINESS', 'GOVERNMENT_JOB', 'DOCTOR', 'TEACHER', 'ENGINEER', 'ACCOUNTANT', 'OTHER', 'ANY');

-- CreateEnum
CREATE TYPE "ResidenceTypePreference" AS ENUM ('OWN_HOUSE', 'RENTED', 'FAMILY_OWNED', 'ANY');

-- CreateEnum
CREATE TYPE "FamilyStatusPreference" AS ENUM ('UPPER_CLASS', 'HIGH_MIDDLE_CLASS', 'MIDDLE_CLASS', 'ANY');

-- CreateEnum
CREATE TYPE "SiblingPositionPreference" AS ENUM ('ELDEST', 'YOUNGEST', 'MIDDLE', 'ONLY_CHILD', 'ANY');

-- CreateEnum
CREATE TYPE "EmploymentTypePreference" AS ENUM ('FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'STUDENT', 'HOMEMAKER', 'UNEMPLOYED', 'ANY');

-- CreateTable
CREATE TABLE "partner_preferences" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "preferredGender" "Gender" NOT NULL,
    "minAge" INTEGER NOT NULL DEFAULT 21,
    "maxAge" INTEGER NOT NULL DEFAULT 35,
    "complexions" "ComplexionPreference"[],
    "minHeightCm" INTEGER,
    "maxHeightCm" INTEGER,
    "educationLevels" "EducationPreference"[],
    "occupations" "OccupationPreference"[],
    "maritalStatuses" "MaritalStatus"[],
    "minMonthlyIncome" DECIMAL(12,2),
    "maxMonthlyIncome" DECIMAL(12,2),
    "incomeCurrency" TEXT NOT NULL DEFAULT 'USD',
    "residenceType" "ResidenceTypePreference",
    "familyStatus" "FamilyStatusPreference",
    "siblingCountPreference" INTEGER,
    "siblingPositionPreference" "SiblingPositionPreference",
    "preferredDistricts" TEXT[],
    "preferredCountries" TEXT[],
    "preferredReligions" "Religion"[],
    "preferredDenominations" TEXT[],
    "preferredCommunities" TEXT[],
    "preferredMotherTongues" TEXT[],
    "employmentTypes" "EmploymentTypePreference"[],
    "willingToRelocate" BOOLEAN NOT NULL DEFAULT false,
    "openToAbroad" BOOLEAN NOT NULL DEFAULT false,
    "requiresVerifiedProfile" BOOLEAN NOT NULL DEFAULT false,
    "minProfileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customExpectations" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_preferences_profileId_key" ON "partner_preferences"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_preferences_userId_key" ON "partner_preferences"("userId");

-- CreateIndex
CREATE INDEX "partner_preferences_tenantId_isActive_idx" ON "partner_preferences"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "partner_preferences_tenantId_preferredGender_minAge_maxAge_idx" ON "partner_preferences"("tenantId", "preferredGender", "minAge", "maxAge");

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
