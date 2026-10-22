-- AlterTable
ALTER TABLE "community_comments" ADD COLUMN "threadRootCommentId" TEXT;

-- CreateIndex
CREATE INDEX "community_comments_postId_threadRootCommentId_idx" ON "community_comments"("postId", "threadRootCommentId");

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_threadRootCommentId_fkey" FOREIGN KEY ("threadRootCommentId") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill thread roots for existing rows
UPDATE "community_comments" SET "threadRootCommentId" = NULL WHERE "parentCommentId" IS NULL;

UPDATE "community_comments" AS c
SET "threadRootCommentId" = p."id"
FROM "community_comments" AS p
WHERE c."parentCommentId" = p."id" AND p."parentCommentId" IS NULL;

UPDATE "community_comments" AS c
SET "threadRootCommentId" = p."threadRootCommentId"
FROM "community_comments" AS p
WHERE c."parentCommentId" = p."id"
  AND p."parentCommentId" IS NOT NULL
  AND p."threadRootCommentId" IS NOT NULL;
