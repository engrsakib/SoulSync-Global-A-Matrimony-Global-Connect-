'use client';

import { cn } from '@soulsync/ui/lib/utils';
import type { MessengerReactionDto } from '@soulsync/shared-types/messenger';
import { getMessengerSocket, messengerEmitWithAck } from '@/lib/messenger/socket-client';
import { parseMessengerSendAck } from '@/lib/messenger/parse-send-ack';

type Props = {
  messageId: string;
  reactions: MessengerReactionDto[];
  currentUserId: string;
  align: 'start' | 'end';
};

function groupReactions(
  reactions: MessengerReactionDto[],
  currentUserId: string,
): { emoji: string; count: number; mine: boolean }[] {
  const map = new Map<string, { count: number; mine: boolean }>();
  for (const reaction of reactions) {
    const existing = map.get(reaction.emoji) ?? { count: 0, mine: false };
    map.set(reaction.emoji, {
      count: existing.count + 1,
      mine: existing.mine || reaction.userId === currentUserId,
    });
  }
  return [...map.entries()].map(([emoji, meta]) => ({ emoji, ...meta }));
}

export function MessengerMessageReactions({ messageId, reactions, currentUserId, align }: Props) {
  if (reactions.length === 0) {
    return null;
  }

  const groups = groupReactions(reactions, currentUserId);

  async function toggleReaction(emoji: string, mine: boolean) {
    const socket = await getMessengerSocket();
    const payload = { messageId, emoji: mine ? null : emoji };
    const raw = await messengerEmitWithAck<unknown>(socket, 'message:react', payload);
    const ack = parseMessengerSendAck(raw);
    if (ack.error && !ack.message) {
      console.warn('Reaction failed:', ack.error);
    }
  }

  return (
    <div
      className={cn(
        'mt-0.5 flex max-w-full flex-wrap gap-1',
        align === 'end' ? 'justify-end' : 'justify-start',
      )}
    >
      {groups.map(({ emoji, count, mine }) => (
        <button
          key={emoji}
          type="button"
          title={mine ? 'Remove reaction' : 'Add reaction'}
          onClick={() => void toggleReaction(emoji, mine)}
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs shadow-sm',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]',
            mine
              ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-700)]/10 text-[var(--foreground)]'
              : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]',
          )}
        >
          <span className="text-sm leading-none">{emoji}</span>
          {count > 1 ? <span className="font-medium tabular-nums">{count}</span> : null}
        </button>
      ))}
    </div>
  );
}
