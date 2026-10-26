'use client';

import * as React from 'react';
import type { MessengerConversationDto, MessengerMessageDto } from '@soulsync/shared-types/messenger';

export type MessengerPreviewEntry = {
  plainText: string | null;
  status: 'pending' | 'ready' | 'unsent' | 'empty';
};

const PREVIEW_CONCURRENCY = 3;

export function truncateMessengerPreview(text: string, max = 72): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

export function useMessengerPreviewCache(
  decryptLastMessage: (
    conversation: MessengerConversationDto,
    message: MessengerMessageDto,
  ) => Promise<string | null>,
) {
  const [previews, setPreviews] = React.useState<Record<string, MessengerPreviewEntry>>({});

  const setPreview = React.useCallback((conversationId: string, entry: MessengerPreviewEntry) => {
    setPreviews((prev) => ({ ...prev, [conversationId]: entry }));
  }, []);

  const decryptPreview = React.useCallback(
    async (conversation: MessengerConversationDto) => {
      const last = conversation.lastMessage;
      if (!last) {
        setPreview(conversation.id, { plainText: null, status: 'empty' });
        return;
      }
      if (last.unsentAt || !last.ciphertext) {
        setPreview(conversation.id, { plainText: null, status: 'unsent' });
        return;
      }
      setPreview(conversation.id, { plainText: null, status: 'pending' });
      try {
        const plainText = await decryptLastMessage(conversation, last);
        setPreview(conversation.id, {
          plainText,
          status: plainText ? 'ready' : 'empty',
        });
      } catch {
        setPreview(conversation.id, { plainText: null, status: 'empty' });
      }
    },
    [decryptLastMessage, setPreview],
  );

  const warmAll = React.useCallback(
    (conversations: MessengerConversationDto[]) => {
      const queue = [...conversations];
      const worker = async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (next) {
            await decryptPreview(next);
          }
        }
      };
      void Promise.all(
        Array.from({ length: Math.min(PREVIEW_CONCURRENCY, conversations.length || 1) }, () =>
          worker(),
        ),
      );
    },
    [decryptPreview],
  );

  const updateFromPlainText = React.useCallback(
    (conversationId: string, plainText: string | null, unsent = false) => {
      if (unsent) {
        setPreview(conversationId, { plainText: null, status: 'unsent' });
        return;
      }
      setPreview(conversationId, {
        plainText,
        status: plainText ? 'ready' : 'empty',
      });
    },
    [setPreview],
  );

  return { previews, warmAll, updateFromPlainText };
}
