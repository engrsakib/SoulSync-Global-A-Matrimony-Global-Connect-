export const MESSENGER_PARTICIPANT_FOLDERS = ['INBOX', 'REQUESTS', 'ARCHIVED'] as const;
export type MessengerParticipantFolderDto = (typeof MESSENGER_PARTICIPANT_FOLDERS)[number];

export const MESSENGER_PRIVACY_ACTIONS = ['BLOCK', 'RESTRICT'] as const;
export type MessengerPrivacyActionDto = (typeof MESSENGER_PRIVACY_ACTIONS)[number];

export const MESSENGER_REACTION_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;
export type MessengerReactionEmojiDto = (typeof MESSENGER_REACTION_EMOJI)[number];

export function isMessengerReactionEmoji(value: string): value is MessengerReactionEmojiDto {
  return (MESSENGER_REACTION_EMOJI as readonly string[]).includes(value);
}

export type MessengerOneTimePrekeyDto = {
  keyId: number;
  publicKey: string;
};

export type MessengerKeyBundleDto = {
  userId: string;
  identityPublicKey: string;
  signedPreKeyPublic: string;
  signedPreKeySignature: string;
  signedPreKeyId: number;
  oneTimePrekeys: MessengerOneTimePrekeyDto[];
};

export type PublishMessengerKeysRequestDto = {
  identityPublicKey: string;
  signedPreKeyPublic: string;
  signedPreKeySignature: string;
  signedPreKeyId: number;
  oneTimePrekeys: MessengerOneTimePrekeyDto[];
};

export type MessengerPeerSummaryDto = {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
};

export type MessengerConversationDto = {
  id: string;
  folder: MessengerParticipantFolderDto;
  peer: MessengerPeerSummaryDto;
  lastMessage: MessengerMessageDto | null;
  unreadCount: number;
  updatedAt: string;
};

export type MessengerReactionDto = {
  userId: string;
  emoji: MessengerReactionEmojiDto;
  updatedAt: string;
};

export type MessengerMessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  nonce: string;
  header: Record<string, unknown>;
  version: number;
  editedAt: string | null;
  unsentAt: string | null;
  createdAt: string;
  reactions: MessengerReactionDto[];
};

export type MessengerConversationListDto = {
  items: MessengerConversationDto[];
  totalUnread: number;
};

export type CreateMessengerConversationRequestDto = {
  username: string;
};

export type MessengerPrivacyRequestDto = {
  targetUserId: string;
  action: MessengerPrivacyActionDto | null;
};

export type MessengerLinkPreviewDto = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
};

export type MessengerSocketTicketDto = {
  ticket: string;
  expiresInSeconds: number;
};

export type MessengerMessagesPageDto = {
  items: MessengerMessageDto[];
  nextCursor: string | null;
};

export type MessengerPeerIdentityReportRequestDto = {
  peerUserId: string;
  identityFingerprint: string;
};

export type MessengerPeerIdentityReportResponseDto = {
  changed: boolean;
};
