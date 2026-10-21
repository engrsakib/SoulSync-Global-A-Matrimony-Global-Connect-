-- CreateEnum
CREATE TYPE "CommunityPrivacy" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "CommunityPostApprovalMode" AS ENUM ('AUTO_APPROVE', 'ALL_PENDING', 'TRUSTED_AUTO_REST_PENDING');
CREATE TYPE "CommunityMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');
CREATE TYPE "CommunityMemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED', 'REMOVED', 'LEFT');
CREATE TYPE "CommunityPostStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');
CREATE TYPE "CommunityReactionKind" AS ENUM ('LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY');
CREATE TYPE "CommunityJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "coverImagePublicId" TEXT,
    "allowedReligions" "Religion"[] DEFAULT ARRAY[]::"Religion"[],
    "allowedCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "privacy" "CommunityPrivacy" NOT NULL DEFAULT 'PUBLIC',
    "postApprovalMode" "CommunityPostApprovalMode" NOT NULL DEFAULT 'AUTO_APPROVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_members" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "CommunityMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "CommunityMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "isTrustedPoster" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "removedByUserId" TEXT,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_join_requests" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "message" TEXT,
    "status" "CommunityJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_join_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bodyText" TEXT,
    "status" "CommunityPostStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "referencedUserId" TEXT,
    "shareToken" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_post_images" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "width" INTEGER,
    "height" INTEGER,

    CONSTRAINT "community_post_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "bodyText" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_reactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "kind" "CommunityReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_reactions_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "communities_tenantId_slug_key" ON "communities"("tenantId", "slug");
CREATE INDEX "communities_tenantId_deletedAt_idx" ON "communities"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "community_members_communityId_userId_key" ON "community_members"("communityId", "userId");
CREATE INDEX "community_members_communityId_status_role_idx" ON "community_members"("communityId", "status", "role");
CREATE INDEX "community_members_userId_status_idx" ON "community_members"("userId", "status");

CREATE INDEX "community_join_requests_communityId_status_createdAt_idx" ON "community_join_requests"("communityId", "status", "createdAt");
CREATE INDEX "community_join_requests_userId_status_idx" ON "community_join_requests"("userId", "status");
CREATE UNIQUE INDEX "community_join_requests_one_pending" ON "community_join_requests"("communityId", "userId") WHERE "status" = 'PENDING';

CREATE UNIQUE INDEX "community_posts_shareToken_key" ON "community_posts"("shareToken");
CREATE INDEX "community_posts_communityId_status_publishedAt_idx" ON "community_posts"("communityId", "status", "publishedAt");
CREATE INDEX "community_posts_authorUserId_communityId_idx" ON "community_posts"("authorUserId", "communityId");

CREATE INDEX "community_post_images_postId_sortOrder_idx" ON "community_post_images"("postId", "sortOrder");

CREATE INDEX "community_comments_postId_createdAt_idx" ON "community_comments"("postId", "createdAt");

CREATE UNIQUE INDEX "community_reactions_userId_postId_key" ON "community_reactions"("userId", "postId");
CREATE UNIQUE INDEX "community_reactions_userId_commentId_key" ON "community_reactions"("userId", "commentId");
CREATE INDEX "community_reactions_postId_idx" ON "community_reactions"("postId");
CREATE INDEX "community_reactions_commentId_idx" ON "community_reactions"("commentId");

-- ForeignKeys
ALTER TABLE "communities" ADD CONSTRAINT "communities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communities" ADD CONSTRAINT "communities_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "community_members" ADD CONSTRAINT "community_members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_removedByUserId_fkey" FOREIGN KEY ("removedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "community_join_requests" ADD CONSTRAINT "community_join_requests_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_join_requests" ADD CONSTRAINT "community_join_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_join_requests" ADD CONSTRAINT "community_join_requests_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_referencedUserId_fkey" FOREIGN KEY ("referencedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "community_post_images" ADD CONSTRAINT "community_post_images_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "community_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
