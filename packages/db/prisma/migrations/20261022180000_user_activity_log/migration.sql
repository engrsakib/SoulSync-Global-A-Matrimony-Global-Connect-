-- CreateEnum
CREATE TYPE "UserActivityType" AS ENUM (
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
  'COMMUNITY_POST_UPDATED'
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "UserActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "linkPath" TEXT NOT NULL,
  "actorUserId" TEXT,
  "relatedUserId" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_activity_logs_userId_occurredAt_id_idx" ON "user_activity_logs"("userId", "occurredAt", "id");

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
