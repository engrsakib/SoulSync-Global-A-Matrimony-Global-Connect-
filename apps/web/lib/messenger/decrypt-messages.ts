import type { MessengerMessageDto } from '@soulsync/shared-types/messenger';
import {
  decryptThreadForPeer,
  headerCryptoVersion,
  MESSENGER_CRYPTO_HEADER_V2,
  type PeerKeyMaterial,
} from '@/lib/messenger/crypto/key-store';
import { lookupPlaintext } from '@/lib/messenger/plaintext-cache';

export type MessageDecryptState = 'ok' | 'failed' | 'legacy' | 'unsent';

export type DecryptedMessage = MessengerMessageDto & {
  plainText: string | null;
  decryptState: MessageDecryptState;
};

export function mergeMessagesById(
  existing: MessengerMessageDto[],
  incoming: MessengerMessageDto[],
): MessengerMessageDto[] {
  const map = new Map<string, MessengerMessageDto>();
  for (const message of existing) {
    map.set(message.id, message);
  }
  for (const message of incoming) {
    map.set(message.id, message);
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function decryptMessagesForThread(
  peerUserId: string,
  keys: PeerKeyMaterial,
  messages: MessengerMessageDto[],
  currentUserId: string,
): Promise<DecryptedMessage[]> {
  const sorted = mergeMessagesById([], messages);
  const plainTexts = await decryptThreadForPeer(
    peerUserId,
    keys.identity,
    keys.signed,
    sorted,
    currentUserId,
  );

  return Promise.all(
    sorted.map(async (message, index) => {
      if (message.unsentAt || !message.ciphertext) {
        return { ...message, plainText: null, decryptState: 'unsent' as const };
      }

      const plainText = plainTexts[index] ?? null;
      if (plainText) {
        return { ...message, plainText, decryptState: 'ok' as const };
      }

      const cached = await lookupPlaintext(message.id);
      if (cached) {
        return { ...message, plainText: cached, decryptState: 'ok' as const };
      }

      const ver = headerCryptoVersion(message.header);
      const decryptState: MessageDecryptState =
        ver !== MESSENGER_CRYPTO_HEADER_V2 ? 'legacy' : 'failed';
      return { ...message, plainText: null, decryptState };
    }),
  );
}

export function decryptPlaceholder(state: MessageDecryptState): string {
  switch (state) {
    case 'legacy':
      return 'Message from an older encryption version';
    case 'failed':
      return "Can't decrypt this message on this device";
    case 'unsent':
      return 'Message unsent';
    default:
      return 'Decrypting…';
  }
}
