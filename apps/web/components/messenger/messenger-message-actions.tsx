'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { MESSENGER_REACTION_EMOJI } from '@soulsync/shared-types/messenger';
import { getMessengerSocket, messengerEmitWithAck } from '@/lib/messenger/socket-client';
import { parseMessengerSendAck } from '@/lib/messenger/parse-send-ack';

type Props = {
  messageId: string;
  mine: boolean;
  onEdit?: () => void;
  align: 'start' | 'end';
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MessengerMessageActions({
  messageId,
  mine,
  onEdit,
  align,
  open,
  onOpenChange,
}: Props) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) {
        return;
      }
      onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onOpenChange]);

  const visible = open;

  return (
    <div
      ref={panelRef}
      className={cn('relative flex shrink-0 flex-col', align === 'end' ? 'items-end' : 'items-start')}
    >
      <button
        type="button"
        aria-label="Message actions"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)]',
          'opacity-0 transition-opacity group-hover/msg:opacity-100',
          open && 'opacity-100 bg-[var(--muted)] text-[var(--foreground)]',
          'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]',
          'hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <div
        className={cn(
          'absolute top-full z-30 mt-1.5 w-max max-w-[min(92vw,20rem)]',
          align === 'end' ? 'right-0' : 'left-0',
          'origin-top scale-95 opacity-0 transition-[opacity,transform] duration-150',
          visible && 'pointer-events-auto scale-100 opacity-100',
          !visible && 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]',
            'shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
          )}
        >
          <div
            className="flex flex-nowrap items-center justify-center gap-0.5 px-2 py-2"
            role="toolbar"
            aria-label="React to message"
          >
            {MESSENGER_REACTION_EMOJI.map((emoji) => (
              <button
                key={emoji}
                type="button"
                title={`React ${emoji}`}
                className={cn(
                  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[1.125rem]',
                  'transition-colors hover:bg-[var(--muted)] active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]',
                )}
                onClick={() => {
                  void (async () => {
                    const socket = await getMessengerSocket();
                    const raw = await messengerEmitWithAck<unknown>(socket, 'message:react', {
                      messageId,
                      emoji,
                    });
                    parseMessengerSendAck(raw);
                    onOpenChange(false);
                  })();
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {mine ? (
            <>
              <div className="h-px bg-[var(--border)]" role="separator" />
              <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                <button
                  type="button"
                  className={cn(
                    'px-4 py-2.5 text-center text-xs font-medium text-[var(--foreground)]',
                    'transition-colors hover:bg-[var(--muted)]',
                    'focus-visible:outline-none focus-visible:bg-[var(--muted)]',
                  )}
                  onClick={() => {
                    onEdit?.();
                    onOpenChange(false);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={cn(
                    'px-4 py-2.5 text-center text-xs font-medium text-red-600 dark:text-red-400',
                    'transition-colors hover:bg-red-500/10',
                    'focus-visible:outline-none focus-visible:bg-red-500/10',
                  )}
                  onClick={() => {
                    void (async () => {
                      const socket = await getMessengerSocket();
                      await messengerEmitWithAck(socket, 'message:unsend', { messageId });
                      onOpenChange(false);
                    })();
                  }}
                >
                  Unsend
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
