-- CreateEnum
CREATE TYPE "BiodataSectionVisibilityMode" AS ENUM ('DIRECT', 'REQUEST');

-- CreateEnum
CREATE TYPE "BiodataAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "biodata_section_visibilities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "mode" "BiodataSectionVisibilityMode" NOT NULL DEFAULT 'REQUEST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biodata_section_visibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biodata_access_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "status" "BiodataAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "expiresAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biodata_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "biodata_section_visibilities_ownerUserId_sectionId_key" ON "biodata_section_visibilities"("ownerUserId", "sectionId");

-- CreateIndex
CREATE INDEX "biodata_section_visibilities_tenantId_ownerUserId_idx" ON "biodata_section_visibilities"("tenantId", "ownerUserId");

-- CreateIndex
CREATE INDEX "biodata_access_requests_ownerUserId_status_createdAt_idx" ON "biodata_access_requests"("ownerUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "biodata_access_requests_requesterUserId_status_idx" ON "biodata_access_requests"("requesterUserId", "status");

-- CreateIndex
CREATE INDEX "biodata_access_requests_tenantId_status_idx" ON "biodata_access_requests"("tenantId", "status");

-- One pending request per owner + requester + section
CREATE UNIQUE INDEX "biodata_access_requests_pending_unique" ON "biodata_access_requests"("ownerUserId", "requesterUserId", "sectionId") WHERE "status" = 'PENDING';

-- AddForeignKey
ALTER TABLE "biodata_section_visibilities" ADD CONSTRAINT "biodata_section_visibilities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_section_visibilities" ADD CONSTRAINT "biodata_section_visibilities_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_access_requests" ADD CONSTRAINT "biodata_access_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_access_requests" ADD CONSTRAINT "biodata_access_requests_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_access_requests" ADD CONSTRAINT "biodata_access_requests_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
