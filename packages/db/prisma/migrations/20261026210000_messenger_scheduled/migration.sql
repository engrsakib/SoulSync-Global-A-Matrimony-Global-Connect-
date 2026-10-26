-- CreateEnum
CREATE TYPE "MessengerScheduledMessageStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "messenger_scheduled_messages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "MessengerScheduledMessageStatus" NOT NULL DEFAULT 'SCHEDULED',
    "draftPlaintextEnc" TEXT NOT NULL,
    "jobId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messenger_scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messenger_scheduled_messages_senderId_status_scheduledAt_idx" ON "messenger_scheduled_messages"("senderId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "messenger_scheduled_messages_conversationId_status_idx" ON "messenger_scheduled_messages"("conversationId", "status");

-- AddForeignKey
ALTER TABLE "messenger_scheduled_messages" ADD CONSTRAINT "messenger_scheduled_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "messenger_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messenger_scheduled_messages" ADD CONSTRAINT "messenger_scheduled_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
