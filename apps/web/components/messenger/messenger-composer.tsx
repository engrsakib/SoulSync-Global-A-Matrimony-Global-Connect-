'use client';

import * as React from 'react';
import { ChevronDown, Smile } from 'lucide-react';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import { MESSENGER_COMPOSER_EMOJI } from '@/lib/messenger/messenger-emoji-picker-data';
import { MessengerGiphyPicker } from './messenger-giphy-picker';

const TEXTAREA_MAX_HEIGHT_PX = 128;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSchedule: () => void;
  sending: boolean;
  editing: boolean;
  sendError: string | null;
  onClearSendError: () => void;
};

function syncTextareaHeight(el: HTMLTextAreaElement | null) {
  if (!el) {
    return;
  }
  el.style.height = 'auto';
  const next = Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX);
  el.style.height = `${next}px`;
}

export function MessengerComposer({
  value,
  onChange,
  onSend,
  onSchedule,
  sending,
  editing,
  sendError,
  onClearSendError,
}: Props) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const [giphySession, setGiphySession] = React.useState(0);
  const giphyOpen = giphySession > 0;
  const emojiRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    syncTextareaHeight(textareaRef.current);
  }, [value]);

  React.useEffect(() => {
    if (!emojiOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (emojiRef.current?.contains(event.target as Node)) {
        return;
      }
      setEmojiOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [emojiOpen]);

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + text);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    onClearSendError();
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
      syncTextareaHeight(el);
    });
  }

  const iconButtonClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]';

  return (
    <>
      <footer className="min-w-0 border-t border-[var(--border)] p-2 sm:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <div className="relative flex shrink-0 gap-1">
            <button
              type="button"
              aria-label="Emoji"
              className={iconButtonClass}
              onClick={() => setEmojiOpen((o) => !o)}
              disabled={sending}
            >
              <Smile className="h-[18px] w-[18px]" />
            </button>
            {emojiOpen ? (
              <div
                ref={emojiRef}
                className="absolute bottom-full left-0 z-20 mb-2 grid w-56 grid-cols-6 gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg"
              >
                {MESSENGER_COMPOSER_EMOJI.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="rounded-lg p-1 text-lg hover:bg-[var(--muted)]"
                    onClick={() => insertAtCursor(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              aria-label="GIF"
              className={`${iconButtonClass} text-[10px] font-bold`}
              onClick={() => setGiphySession((s) => s + 1)}
              disabled={sending}
            >
              GIF
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              onClearSendError();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder={editing ? 'Edit message…' : 'Aa'}
            className="min-h-[36px] min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm leading-5 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maxHeight: TEXTAREA_MAX_HEIGHT_PX }}
            disabled={sending}
          />
          <button
            type="button"
            aria-label="Send"
            disabled={sending || !value.trim()}
            onClick={onSend}
            onContextMenu={(e) => {
              e.preventDefault();
              if (!value.trim() || sending || editing) {
                return;
              }
              onSchedule();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-white disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
          >
            <HiOutlinePaperAirplane className="h-[18px] w-[18px]" />
          </button>
          <div className="hidden shrink-0 flex-col gap-0.5 md:flex">
            <button
              type="button"
              aria-label="Send"
              disabled={sending || !value.trim()}
              onClick={onSend}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!value.trim() || sending || editing) {
                  return;
                }
                onSchedule();
              }}
              className="flex h-9 w-10 items-center justify-center rounded-t-xl bg-[var(--color-brand-700)] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HiOutlinePaperAirplane className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Schedule message"
              title="Schedule message"
              disabled={sending || !value.trim() || editing}
              onClick={onSchedule}
              className="flex h-5 w-10 items-center justify-center rounded-b-xl border border-t-0 border-[var(--color-brand-700)] bg-[var(--color-brand-800)] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
        {sendError ? (
          <p className="mt-2 text-xs text-red-400" role="alert">
            {sendError}
          </p>
        ) : null}
        <p className="sr-only">
          Long-press Send to schedule. Messages encrypt on your device before they leave the browser.
        </p>
        <p className="mt-2 hidden text-[10px] text-[var(--muted-foreground)] md:block">
          Right-click Send or use ▾ to schedule. Messages encrypt on your device before they leave the
          browser.
        </p>
      </footer>
      {giphyOpen ? (
        <MessengerGiphyPicker
          key={giphySession}
          onClose={() => setGiphySession(0)}
          onPick={(url) => insertAtCursor(url)}
        />
      ) : null}
    </>
  );
}
