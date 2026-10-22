-- CreateEnum
CREATE TYPE "BiodataEditorGrantStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BiodataEditorGrantInitiatedBy" AS ENUM ('OWNER', 'EDITOR');

-- AlterEnum
ALTER TYPE "UserNotificationType" ADD VALUE 'BIODATA_EDITOR_INVITE';
ALTER TYPE "UserNotificationType" ADD VALUE 'BIODATA_EDITOR_REQUEST';
ALTER TYPE "UserNotificationType" ADD VALUE 'BIODATA_EDITOR_DECIDED';

-- CreateTable
CREATE TABLE "biodata_editor_grants" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "editorUserId" TEXT NOT NULL,
    "status" "BiodataEditorGrantStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedBy" "BiodataEditorGrantInitiatedBy" NOT NULL,
    "message" TEXT,
    "expiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biodata_editor_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "biodata_editor_grants_ownerUserId_editorUserId_key" ON "biodata_editor_grants"("ownerUserId", "editorUserId");

-- CreateIndex
CREATE INDEX "biodata_editor_grants_editorUserId_status_idx" ON "biodata_editor_grants"("editorUserId", "status");

-- CreateIndex
CREATE INDEX "biodata_editor_grants_ownerUserId_status_idx" ON "biodata_editor_grants"("ownerUserId", "status");

-- CreateIndex
CREATE INDEX "biodata_editor_grants_tenantId_status_idx" ON "biodata_editor_grants"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "biodata_editor_grants" ADD CONSTRAINT "biodata_editor_grants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_editor_grants" ADD CONSTRAINT "biodata_editor_grants_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biodata_editor_grants" ADD CONSTRAINT "biodata_editor_grants_editorUserId_fkey" FOREIGN KEY ("editorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
