-- CreateTable
CREATE TABLE "my_preferences" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "complexion" "ComplexionPreference",
    "heightCm" INTEGER,
    "educationLevel" "EducationPreference",
    "occupation" "OccupationPreference",
    "maritalStatus" "MaritalStatus",
    "monthlyIncome" DECIMAL(12,2),
    "incomeCurrency" TEXT NOT NULL DEFAULT 'USD',
    "residenceType" "ResidenceTypePreference",
    "familyStatus" "FamilyStatusPreference",
    "siblingCount" INTEGER,
    "siblingPosition" "SiblingPositionPreference",
    "district" TEXT,
    "country" TEXT,
    "religion" "Religion",
    "denomination" TEXT,
    "community" TEXT,
    "motherTongue" TEXT,
    "employmentTypes" "EmploymentTypePreference"[],
    "willingToRelocate" BOOLEAN NOT NULL DEFAULT false,
    "openToAbroad" BOOLEAN NOT NULL DEFAULT false,
    "customExpectations" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "my_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "my_preferences_profileId_key" ON "my_preferences"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "my_preferences_userId_key" ON "my_preferences"("userId");

-- CreateIndex
CREATE INDEX "my_preferences_tenantId_isActive_idx" ON "my_preferences"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "my_preferences_tenantId_gender_religion_idx" ON "my_preferences"("tenantId", "gender", "religion");

-- AddForeignKey
ALTER TABLE "my_preferences" ADD CONSTRAINT "my_preferences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_preferences" ADD CONSTRAINT "my_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_preferences" ADD CONSTRAINT "my_preferences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
