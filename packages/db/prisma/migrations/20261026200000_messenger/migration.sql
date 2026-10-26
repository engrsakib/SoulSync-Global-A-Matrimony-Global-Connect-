-- AlterEnum
ALTER TYPE "UserNotificationType" ADD VALUE 'MESSENGER_SECURITY_CODE_CHANGED';

-- CreateEnum
CREATE TYPE "MessengerParticipantFolder" AS ENUM ('INBOX', 'REQUESTS', 'ARCHIVED');
CREATE TYPE "MessengerPrivacyAction" AS ENUM ('BLOCK', 'RESTRICT');

-- CreateTable
CREATE TABLE "messenger_key_bundles" (
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "identityPublicKey" TEXT NOT NULL,
    "signedPreKeyPublic" TEXT NOT NULL,
    "signedPreKeySignature" TEXT NOT NULL,
    "signedPreKeyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_key_bundles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "messenger_one_time_prekeys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyId" INTEGER NOT NULL,
    "publicKey" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messenger_one_time_prekeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messenger_conversations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "participantLowId" TEXT NOT NULL,
    "participantHighId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messenger_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folder" "MessengerParticipantFolder" NOT NULL DEFAULT 'INBOX',
    "lastReadMessageId" TEXT,
    "peerIdentityFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messenger_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "header" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "editedAt" TIMESTAMP(3),
    "unsentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messenger_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messenger_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messenger_privacy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" "MessengerPrivacyAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messenger_privacy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messenger_key_bundles_tenantId_idx" ON "messenger_key_bundles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_one_time_prekeys_userId_keyId_key" ON "messenger_one_time_prekeys"("userId", "keyId");

-- CreateIndex
CREATE INDEX "messenger_one_time_prekeys_userId_consumedAt_idx" ON "messenger_one_time_prekeys"("userId", "consumedAt");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_conversations_tenantId_participantLowId_participant_key" ON "messenger_conversations"("tenantId", "participantLowId", "participantHighId");

-- CreateIndex
CREATE INDEX "messenger_conversations_tenantId_updatedAt_idx" ON "messenger_conversations"("tenantId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_participants_conversationId_userId_key" ON "messenger_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messenger_participants_userId_folder_updatedAt_idx" ON "messenger_participants"("userId", "folder", "updatedAt");

-- CreateIndex
CREATE INDEX "messenger_messages_conversationId_createdAt_idx" ON "messenger_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "messenger_messages_conversationId_id_idx" ON "messenger_messages"("conversationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_reactions_messageId_userId_key" ON "messenger_reactions"("messageId", "userId");

-- CreateIndex
CREATE INDEX "messenger_reactions_messageId_idx" ON "messenger_reactions"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "messenger_privacy_ownerId_targetId_key" ON "messenger_privacy"("ownerId", "targetId");

-- CreateIndex
CREATE INDEX "messenger_privacy_targetId_action_idx" ON "messenger_privacy"("targetId", "action");

-- AddForeignKey
ALTER TABLE "messenger_key_bundles" ADD CONSTRAINT "messenger_key_bundles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_one_time_prekeys" ADD CONSTRAINT "messenger_one_time_prekeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "messenger_key_bundles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_participants" ADD CONSTRAINT "messenger_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "messenger_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_participants" ADD CONSTRAINT "messenger_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_messages" ADD CONSTRAINT "messenger_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "messenger_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_messages" ADD CONSTRAINT "messenger_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_reactions" ADD CONSTRAINT "messenger_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messenger_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_reactions" ADD CONSTRAINT "messenger_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_privacy" ADD CONSTRAINT "messenger_privacy_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_privacy" ADD CONSTRAINT "messenger_privacy_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
