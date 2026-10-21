-- AlterEnum
ALTER TYPE "CommunityPostStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';

-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN "scheduledPublishAt" TIMESTAMP(3),
ADD COLUMN "scheduleJobId" TEXT;

-- CreateIndex
CREATE INDEX "community_posts_status_scheduledPublishAt_idx" ON "community_posts"("status", "scheduledPublishAt");
