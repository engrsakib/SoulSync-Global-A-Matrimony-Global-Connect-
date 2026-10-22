-- Denormalized engagement + hot score for ranked feeds
ALTER TABLE "community_posts" ADD COLUMN "reactionsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "community_posts" ADD COLUMN "commentsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "community_posts" ADD COLUMN "sharesCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "community_posts" ADD COLUMN "hotScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "community_posts" ADD COLUMN "hotScoreUpdatedAt" TIMESTAMP(3);

CREATE INDEX "community_posts_communityId_status_hotScore_id_idx" ON "community_posts"("communityId", "status", "hotScore", "id");

UPDATE "community_posts" AS p
SET "reactionsCount" = COALESCE(r.cnt, 0)
FROM (
  SELECT "postId", COUNT(*)::int AS cnt
  FROM "community_reactions"
  WHERE "postId" IS NOT NULL
  GROUP BY "postId"
) AS r
WHERE p."id" = r."postId";

UPDATE "community_posts" AS p
SET "commentsCount" = COALESCE(c.cnt, 0)
FROM (
  SELECT "postId", COUNT(*)::int AS cnt
  FROM "community_comments"
  WHERE "deletedAt" IS NULL
  GROUP BY "postId"
) AS c
WHERE p."id" = c."postId";

-- hotScore backfill: engagement / (hours + 2)^1.5
UPDATE "community_posts"
SET
  "hotScore" = (
    ("reactionsCount" * 1.0 + "commentsCount" * 2.0 + "sharesCount" * 3.0)
    / POWER(
      GREATEST(
        1.0,
        EXTRACT(EPOCH FROM (NOW() - COALESCE("publishedAt", "createdAt"))) / 3600.0
      ) + 2.0,
      1.5
    )
  ),
  "hotScoreUpdatedAt" = NOW()
WHERE "deletedAt" IS NULL;
