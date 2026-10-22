-- AlterEnum UserActivityType
ALTER TYPE "UserActivityType" ADD VALUE IF NOT EXISTS 'BIODATA_VIEWED';
ALTER TYPE "UserActivityType" ADD VALUE IF NOT EXISTS 'BIODATA_PRIVACY_UPDATED';

-- CreateEnum
CREATE TYPE "AuditEventStatus" AS ENUM ('SUCCESS', 'FAILURE');

CREATE TYPE "AuditEventType" AS ENUM (
  'PROFILE_UPDATED',
  'BIODATA_UPDATED',
  'BIODATA_UPDATED_BY_EDITOR',
  'BIODATA_EDITED_FOR_OWNER',
  'BIODATA_ACCESS_REQUEST_SENT',
  'BIODATA_ACCESS_REQUEST_RECEIVED',
  'BIODATA_ACCESS_REQUEST_DECIDED',
  'BIODATA_EDITOR_INVITE',
  'BIODATA_EDITOR_REQUEST',
  'BIODATA_EDITOR_DECIDED',
  'COMMUNITY_COMMENT_CREATED',
  'COMMUNITY_REACTION_ADDED',
  'COMMUNITY_POST_UPDATED',
  'BIODATA_VIEWED',
  'BIODATA_PRIVACY_UPDATED',
  'AUTH_LOGIN',
  'AUTH_LOGIN_FAILED',
  'AUTH_REFRESH',
  'AUTH_REFRESH_FAILED'
);

CREATE TABLE "audit_events" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" "AuditEventType" NOT NULL,
  "status" "AuditEventStatus" NOT NULL DEFAULT 'SUCCESS',
  "actorUserId" TEXT,
  "targetUserId" TEXT,
  "linkPath" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_events_tenantId_occurredAt_id_idx" ON "audit_events"("tenantId", "occurredAt", "id");
CREATE INDEX "audit_events_actorUserId_occurredAt_id_idx" ON "audit_events"("actorUserId", "occurredAt", "id");
CREATE INDEX "audit_events_targetUserId_occurredAt_id_idx" ON "audit_events"("targetUserId", "occurredAt", "id");
CREATE INDEX "audit_events_type_occurredAt_id_idx" ON "audit_events"("type", "occurredAt", "id");
