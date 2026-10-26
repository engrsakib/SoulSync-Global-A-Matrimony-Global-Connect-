'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import type {
  MessengerConversationDto,
  MessengerScheduledMessageDto,
} from '@soulsync/shared-types/messenger';
import {
  cancelScheduledMessage,
  fetchScheduledMessages,
  setMessengerPrivacy,
  updateScheduledMessage,
} from '@/lib/messenger/messenger-api';
import {
  MESSENGER_CHAT_THEMES,
  loadMessengerChatTheme,
  saveMessengerChatTheme,
  type MessengerChatThemeId,
} from '@/lib/messenger/messenger-chat-themes';
import { formatMessengerPeerLabel, peerInitials } from '@/lib/messenger/format-peer-label';
import { MessengerScheduleDialog } from './messenger-schedule-dialog';

type PeerAvatarProps = {
  peer: MessengerConversationDto['peer'];
  className?: string;
};

function PeerAvatar({ peer, className }: PeerAvatarProps) {
  const sizeClass = className ?? 'h-9 w-9';
  if (peer.avatarUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={peer.avatarUrl} alt="" className={cn('shrink-0 rounded-full object-cover', sizeClass)} />
    );
  }
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-800)] text-xs font-semibold text-white',
        sizeClass,
      )}
    >
      {peerInitials(peer)}
    </span>
  );
}

type Props = {
  active: MessengerConversationDto;
  displayedSafetyNumber: string | null;
  onBackMobile?: () => void;
  onRefreshConversations: () => Promise<unknown>;
  onEditScheduledDraft: (item: MessengerScheduledMessageDto) => void;
  scheduleRefreshKey: number;
  onThemeChange: () => void;
};

function MessengerScheduledList({
  conversationId,
  refreshKey,
  onEditScheduledDraft,
  onReschedule,
}: {
  conversationId: string;
  refreshKey: number;
  onEditScheduledDraft: (item: MessengerScheduledMessageDto) => void;
  onReschedule: (id: string, scheduledAt: string) => void;
}) {
  const [scheduled, setScheduled] = React.useState<MessengerScheduledMessageDto[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void fetchScheduledMessages(conversationId)
      .then((items) => {
        if (!cancelled) {
          setScheduled(items.filter((row) => row.status === 'SCHEDULED'));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScheduled([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, refreshKey]);

  if (!ready) {
    return <p className="text-xs text-slate-400">Loading…</p>;
  }
  if (scheduled.length === 0) {
    return <p className="text-xs text-slate-400">No scheduled messages for this chat.</p>;
  }
  return (
    <ul className="space-y-2">
      {scheduled.map((item) => (
        <li
          key={item.id}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-xs"
        >
          <p className="font-medium text-[var(--foreground)]">{formatScheduleTime(item.scheduledAt)}</p>
          <p className="mt-1 line-clamp-2 text-slate-400">
            {item.plaintextPreview?.trim() || 'Encrypted draft'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[10px] text-slate-300"
              onClick={() => onEditScheduledDraft(item)}
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[10px] text-slate-300"
              onClick={() => onReschedule(item.id, item.scheduledAt)}
            >
              Reschedule
            </button>
            <button
              type="button"
              className="rounded-md border border-red-500/40 px-2 py-0.5 text-[10px] text-red-400"
              onClick={() =>
                void cancelScheduledMessage(item.id).then(() => {
                  setScheduled((prev) => prev.filter((row) => row.id !== item.id));
                })
              }
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatScheduleTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function MessengerProfilePanel({
  active,
  displayedSafetyNumber,
  onBackMobile,
  onRefreshConversations,
  onEditScheduledDraft,
  scheduleRefreshKey,
  onThemeChange,
}: Props) {
  const [rescheduleId, setRescheduleId] = React.useState<string | null>(null);
  const [rescheduleAt, setRescheduleAt] = React.useState<string | null>(null);
  const [themeState, setThemeState] = React.useState(() => ({
    conversationId: active.id,
    themeId: loadMessengerChatTheme(active.id),
  }));
  if (themeState.conversationId !== active.id) {
    setThemeState({
      conversationId: active.id,
      themeId: loadMessengerChatTheme(active.id),
    });
  }
  const themeId = themeState.themeId;

  function pickTheme(id: MessengerChatThemeId) {
    saveMessengerChatTheme(active.id, id);
    setThemeState({ conversationId: active.id, themeId: id });
    onThemeChange();
  }

  return (
    <div className="space-y-4">
      {onBackMobile ? (
        <button type="button" className="text-xs text-slate-400 lg:hidden" onClick={onBackMobile}>
          ← Back to chat
        </button>
      ) : null}
      <div className="flex items-center gap-3 rounded-xl bg-[var(--color-brand-800)] p-4 text-white">
        <PeerAvatar peer={active.peer} className="h-12 w-12" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{formatMessengerPeerLabel(active.peer)}</p>
          <p className="truncate text-xs text-slate-300">@{active.peer.username ?? 'member'}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Safety number</p>
        <p className="mt-1 font-mono text-xs leading-relaxed text-slate-300">
          {displayedSafetyNumber ?? '—'}
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Scheduled messages
          </p>
        </div>
        <MessengerScheduledList
          key={`${active.id}-${scheduleRefreshKey}`}
          conversationId={active.id}
          refreshKey={scheduleRefreshKey}
          onEditScheduledDraft={onEditScheduledDraft}
          onReschedule={(id, scheduledAt) => {
            setRescheduleId(id);
            setRescheduleAt(scheduledAt);
          }}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Chat theme</p>
        <div className="grid grid-cols-3 gap-2">
          {MESSENGER_CHAT_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              title={theme.label}
              onClick={() => pickTheme(theme.id)}
              className={cn(
                'h-12 rounded-lg border-2 transition',
                themeId === theme.id
                  ? 'border-[var(--color-brand-600)]'
                  : 'border-transparent hover:border-[var(--border)]',
              )}
              style={{ background: theme.swatch }}
            >
              <span className="sr-only">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-slate-300"
          onClick={() =>
            void setMessengerPrivacy({ targetUserId: active.peer.userId, action: 'RESTRICT' })
          }
        >
          Restrict user
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-400"
          onClick={() =>
            void setMessengerPrivacy({ targetUserId: active.peer.userId, action: 'BLOCK' }).then(
              onRefreshConversations,
            )
          }
        >
          Block user
        </button>
      </div>

      {rescheduleId ? (
        <MessengerScheduleDialog
          key={rescheduleId}
          onClose={() => setRescheduleId(null)}
          title="Reschedule message"
          initialScheduledAt={rescheduleAt}
          onConfirm={async (scheduledAt) => {
            await updateScheduledMessage(rescheduleId, { scheduledAt });
            setRescheduleId(null);
            setRescheduleAt(null);
          }}
        />
      ) : null}
    </div>
  );
}
