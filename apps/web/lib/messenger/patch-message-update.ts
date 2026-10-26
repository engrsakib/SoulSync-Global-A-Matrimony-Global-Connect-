import type { MessengerMessageDto } from '@soulsync/shared-types/messenger';
import type { DecryptedMessage } from '@/lib/messenger/decrypt-messages';

/** Apply socket/API message updates without losing decrypted plaintext. */
export function patchDecryptedMessage(
  existing: DecryptedMessage[],
  updated: MessengerMessageDto,
): DecryptedMessage[] {
  return existing.map((row) =>
    row.id === updated.id
      ? {
          ...row,
          ...updated,
          plainText: row.plainText,
          decryptState: row.decryptState,
        }
      : row,
  );
}
