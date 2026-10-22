-- CreateEnum
CREATE TYPE "UserNotificationType" AS ENUM ('COMMUNITY_MENTION');

-- AlterTable
ALTER TABLE "community_comments" ADD COLUMN "hiddenAt" TIMESTAMP(3),
ADD COLUMN "pinnedRank" INTEGER,
ADD COLUMN "editedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "community_comments_postId_pinnedRank_idx" ON "community_comments"("postId", "pinnedRank");

-- CreateIndex
CREATE UNIQUE INDEX "community_comments_postId_pinnedRank_key" ON "community_comments"("postId", "pinnedRank");

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "UserNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkPath" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notifications_userId_readAt_createdAt_idx" ON "user_notifications"("userId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
