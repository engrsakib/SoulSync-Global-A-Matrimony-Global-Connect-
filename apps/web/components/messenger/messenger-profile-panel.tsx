'use client';

import * as React from 'react';
import Link from 'next/link';
import { BellOff, Copy, Search } from 'lucide-react';
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
import { formatMessengerPeerLabel } from '@/lib/messenger/format-peer-label';
import { memberRoutes } from '@/lib/member-routes';
import { MessengerScheduleDialog } from './messenger-schedule-dialog';
import { MessengerDetailsSection } from './messenger-details-section';
import { MessengerPeerAvatar } from './messenger-peer-avatar';

type Props = {
  active: MessengerConversationDto;
  displayedSafetyNumber: string | null;
  onBackMobile?: () => void;
  onRefreshConversations: () => Promise<unknown>;
  onEditScheduledDraft: (item: MessengerScheduledMessageDto) => void;
  scheduleRefreshKey: number;
  onThemeChange: () => void;
  onFocusSearch?: () => void;
};

function MessengerScheduledList({
  conversationId,
  refreshKey,
  onEditScheduledDraft,
  onReschedule,
  onCountReady,
}: {
  conversationId: string;
  refreshKey: number;
  onEditScheduledDraft: (item: MessengerScheduledMessageDto) => void;
  onReschedule: (id: string, scheduledAt: string) => void;
  onCountReady?: (count: number) => void;
}) {
  const [scheduled, setScheduled] = React.useState<MessengerScheduledMessageDto[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void fetchScheduledMessages(conversationId)
      .then((items) => {
        if (!cancelled) {
          const rows = items.filter((row) => row.status === 'SCHEDULED');
          setScheduled(rows);
          onCountReady?.(rows.length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScheduled([]);
          onCountReady?.(0);
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
  }, [conversationId, refreshKey, onCountReady]);

  if (!ready) {
    return <p className="text-xs text-[var(--muted-foreground)]">Loading…</p>;
  }
  if (scheduled.length === 0) {
    return <p className="text-xs text-[var(--muted-foreground)]">No scheduled messages for this chat.</p>;
  }
  return (
    <ul className="space-y-2">
      {scheduled.map((item) => (
        <li
          key={item.id}
          className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-2 text-xs"
        >
          <p className="font-medium text-[var(--foreground)]">{formatScheduleTime(item.scheduledAt)}</p>
          <p className="mt-1 line-clamp-2 text-[var(--muted-foreground)]">
            {item.plaintextPreview?.trim() || 'Encrypted draft'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--foreground)]"
              onClick={() => onEditScheduledDraft(item)}
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--foreground)]"
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

function QuickAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={disabled ? 'Coming soon' : label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 text-center',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)]">
        {children}
      </span>
      <span className="max-w-[4.5rem] text-[11px] text-[var(--muted-foreground)]">{label}</span>
    </button>
  );
}

export function MessengerProfilePanel({
  active,
  displayedSafetyNumber,
  onBackMobile,
  onRefreshConversations,
  onEditScheduledDraft,
  scheduleRefreshKey,
  onThemeChange,
  onFocusSearch,
}: Props) {
  const [rescheduleId, setRescheduleId] = React.useState<string | null>(null);
  const [rescheduleAt, setRescheduleAt] = React.useState<string | null>(null);
  const [scheduledCount, setScheduledCount] = React.useState(0);
  const [themeState, setThemeState] = React.useState(() => ({
    conversationId: active.id,
    themeId: loadMessengerChatTheme(active.id),
  }));
  const [copiedSafety, setCopiedSafety] = React.useState(false);

  if (themeState.conversationId !== active.id) {
    setThemeState({
      conversationId: active.id,
      themeId: loadMessengerChatTheme(active.id),
    });
  }
  const themeId = themeState.themeId;
  const username = active.peer.username?.trim();
  const biodataHref = username ? memberRoutes.memberBiodata(username) : null;

  function pickTheme(id: MessengerChatThemeId) {
    saveMessengerChatTheme(active.id, id);
    setThemeState({ conversationId: active.id, themeId: id });
    onThemeChange();
  }

  async function copySafetyNumber() {
    if (!displayedSafetyNumber) {
      return;
    }
    try {
      await navigator.clipboard.writeText(displayedSafetyNumber.replace(/\s/g, ''));
      setCopiedSafety(true);
      window.setTimeout(() => setCopiedSafety(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-1">
      {onBackMobile ? (
        <button
          type="button"
          className="mb-2 text-xs font-medium text-[var(--color-brand-600)] lg:hidden"
          onClick={onBackMobile}
        >
          ← Back to chat
        </button>
      ) : null}

      <div className="flex flex-col items-center pb-4 pt-2 text-center">
        <MessengerPeerAvatar peer={active.peer} className="h-24 w-24 text-lg" />
        <p className="mt-3 truncate text-base font-semibold text-[var(--foreground)]">
          {formatMessengerPeerLabel(active.peer)}
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">
          {active.peer.isOnline ? 'Active now' : 'Offline'}
        </p>
        {username ? (
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">@{username}</p>
        ) : null}
      </div>

      <div className="mb-4 flex justify-center gap-6 border-b border-[var(--border)] pb-4">
        <QuickAction label="Search" onClick={onFocusSearch}>
          <Search className="h-[18px] w-[18px] text-[var(--foreground)]" />
        </QuickAction>
        <QuickAction label="Mute" disabled>
          <BellOff className="h-[18px] w-[18px] text-[var(--foreground)]" />
        </QuickAction>
      </div>

      <MessengerDetailsSection title="Chat info" defaultOpen>
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
          Messages are end-to-end encrypted. Only you and {formatMessengerPeerLabel(active.peer)}{' '}
          can read them on your devices.
        </p>
        {biodataHref ? (
          <Link
            href={biodataHref}
            className="inline-block text-xs font-medium text-[var(--color-brand-600)] hover:underline"
          >
            View biodata profile
          </Link>
        ) : null}
        <div>
          <p className="text-xs font-medium text-[var(--foreground)]">Safety number</p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            {displayedSafetyNumber ?? '—'}
          </p>
          {displayedSafetyNumber ? (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-brand-600)]"
              onClick={() => void copySafetyNumber()}
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedSafety ? 'Copied' : 'Copy'}
            </button>
          ) : null}
        </div>
      </MessengerDetailsSection>

      <MessengerDetailsSection title="Customize chat" defaultOpen>
        <p className="text-xs text-[var(--muted-foreground)]">Change theme</p>
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
      </MessengerDetailsSection>

      <MessengerDetailsSection title="Scheduled messages" defaultOpen={scheduledCount > 0}>
        <MessengerScheduledList
          key={`${active.id}-${scheduleRefreshKey}`}
          conversationId={active.id}
          refreshKey={scheduleRefreshKey}
          onEditScheduledDraft={onEditScheduledDraft}
          onReschedule={(id, scheduledAt) => {
            setRescheduleId(id);
            setRescheduleAt(scheduledAt);
          }}
          onCountReady={setScheduledCount}
        />
      </MessengerDetailsSection>

      <MessengerDetailsSection title="Privacy" defaultOpen>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-left text-xs text-[var(--foreground)]"
            onClick={() =>
              void setMessengerPrivacy({ targetUserId: active.peer.userId, action: 'RESTRICT' })
            }
          >
            Restrict user
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-500/40 px-3 py-2 text-left text-xs text-red-400"
            onClick={() =>
              void setMessengerPrivacy({ targetUserId: active.peer.userId, action: 'BLOCK' }).then(
                onRefreshConversations,
              )
            }
          >
            Block user
          </button>
        </div>
      </MessengerDetailsSection>

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
