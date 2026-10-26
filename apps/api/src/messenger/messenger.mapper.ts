import type {
  MessengerConversationDto,
  MessengerMessageDto,
  MessengerPeerSummaryDto,
  MessengerReactionDto,
} from '@soulsync/shared-types/messenger';
import type { MessengerParticipantFolder, Prisma } from '@soulsync/db';

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  nonce: string;
  header: Prisma.JsonValue;
  version: number;
  editedAt: Date | null;
  unsentAt: Date | null;
  createdAt: Date;
  reactions: { userId: string; emoji: string; updatedAt: Date }[];
};

export function toMessageDto(row: MessageRow): MessengerMessageDto {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    ciphertext: row.ciphertext,
    nonce: row.nonce,
    header: typeof row.header === 'object' && row.header !== null ? (row.header as Record<string, unknown>) : {},
    version: row.version,
    editedAt: row.editedAt?.toISOString() ?? null,
    unsentAt: row.unsentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    reactions: row.reactions.map(
      (r): MessengerReactionDto => ({
        userId: r.userId,
        emoji: r.emoji as MessengerReactionDto['emoji'],
        updatedAt: r.updatedAt.toISOString(),
      }),
    ),
  };
}

export function toPeerSummary(input: {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
}): MessengerPeerSummaryDto {
  return {
    userId: input.userId,
    username: input.username,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    isOnline: input.isOnline,
  };
}

export function toConversationDto(input: {
  id: string;
  folder: MessengerParticipantFolder;
  peer: MessengerPeerSummaryDto;
  peerIdentityFingerprint: string | null;
  lastMessage: MessengerMessageDto | null;
  unreadCount: number;
  updatedAt: Date;
}): MessengerConversationDto {
  return {
    id: input.id,
    folder: input.folder,
    peer: input.peer,
    peerIdentityFingerprint: input.peerIdentityFingerprint,
    lastMessage: input.lastMessage,
    unreadCount: input.unreadCount,
    updatedAt: input.updatedAt.toISOString(),
  };
}
