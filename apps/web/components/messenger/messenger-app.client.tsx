'use client';

import * as React from 'react';
import { Plus, Search } from 'lucide-react';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import { cn } from '@soulsync/ui/lib/utils';
import type {
  MessengerConversationDto,
  MessengerMessageDto,
  MessengerParticipantFolderDto,
  MessengerPeerSummaryDto,
} from '@soulsync/shared-types/messenger';
import { MESSENGER_REACTION_EMOJI } from '@soulsync/shared-types/messenger';
import { formatMessengerSafetyNumber } from '@soulsync/shared-types/messenger-safety-number';
import { identityKeyFingerprint } from '@soulsync/shared-types/messenger-safety-number';
import {
  acceptMessageRequest,
  createConversation,
  fetchConversations,
  fetchMessages,
  fetchPeerKeyBundle,
  reportPeerIdentity,
  sendEncryptedMessage,
  setMessengerPrivacy,
} from '@/lib/messenger/messenger-api';
import {
  buildPublishKeysPayload,
  decryptFromPeer,
  decryptThreadForPeer,
  encryptForPeer,
  getLocalIdentityPublicKey,
} from '@/lib/messenger/crypto/key-store';
import { publishMessengerKeys } from '@/lib/messenger/messenger-api';
import { parseMessengerSendAck } from '@/lib/messenger/parse-send-ack';
import {
  disconnectMessengerSocket,
  getMessengerSocket,
  messengerEmitWithAck,
} from '@/lib/messenger/socket-client';
import {
  formatMessengerPeerLabel,
  formatMessengerPeerSubtitle,
  peerInitials,
} from '@/lib/messenger/format-peer-label';
import {
  truncateMessengerPreview,
  useMessengerPreviewCache,
  type MessengerPreviewEntry,
} from '@/lib/messenger/use-messenger-preview-cache';
import { MessengerNewChatDialog } from './messenger-new-chat-dialog';
import { MessageRichContent } from './message-rich-content';

type DecryptedMessage = MessengerMessageDto & { plainText: string | null };

type Props = {
  currentUserId: string;
};

const FOLDERS: { id: MessengerParticipantFolderDto | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'INBOX', label: 'Inbox' },
  { id: 'REQUESTS', label: 'Requests' },
  { id: 'ARCHIVED', label: 'Archived' },
];

function listPreviewSubtitle(
  conversation: MessengerConversationDto,
  preview: MessengerPreviewEntry | undefined,
): string {
  if (conversation.folder === 'REQUESTS') {
    return 'Message request';
  }
  if (preview?.status === 'unsent') {
    return 'Message unsent';
  }
  if (preview?.status === 'pending') {
    return 'Encrypted…';
  }
  if (preview?.status === 'ready' && preview.plainText) {
    return truncateMessengerPreview(preview.plainText);
  }
  return 'End-to-end encrypted';
}

function PeerAvatar({
  peer,
  className,
}: {
  peer: MessengerPeerSummaryDto;
  className?: string;
}) {
  const sizeClass = className ?? 'h-9 w-9';
  if (peer.avatarUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external member avatars
      <img
        src={peer.avatarUrl}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', sizeClass)}
      />
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

export function MessengerAppClient({ currentUserId }: Props) {
  const [folder, setFolder] = React.useState<(typeof FOLDERS)[number]['id']>('ALL');
  const [conversations, setConversations] = React.useState<MessengerConversationDto[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<DecryptedMessage[]>([]);
  const [historyByConversationId, setHistoryByConversationId] = React.useState<
    Record<string, DecryptedMessage[]>
  >({});
  const [composer, setComposer] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [newChatOpen, setNewChatOpen] = React.useState(false);
  const [newChatBusy, setNewChatBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [mobilePane, setMobilePane] = React.useState<'list' | 'thread' | 'profile'>('list');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const peerKeysRef = React.useRef<Record<string, { identity: string; signed: string }>>({});
  const [peerKeys, setPeerKeys] = React.useState<Record<string, { identity: string; signed: string }>>(
    {},
  );
  const [localIdentity, setLocalIdentity] = React.useState<string | null>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const refreshConversations = React.useCallback(async () => {
    const list = await fetchConversations();
    setConversations(list.items);
    return list;
  }, []);

  const loadPeerKeys = React.useCallback(async (peerUserId: string) => {
    const cached = peerKeysRef.current[peerUserId];
    if (cached) {
      return cached;
    }
    const bundle = await fetchPeerKeyBundle(peerUserId);
    const entry = {
      identity: bundle.identityPublicKey,
      signed: bundle.signedPreKeyPublic,
    };
    peerKeysRef.current[peerUserId] = entry;
    setPeerKeys((prev) => ({ ...prev, [peerUserId]: entry }));
    return entry;
  }, []);

  const decryptMessage = React.useCallback(
    async (message: MessengerMessageDto, peerUserId: string): Promise<DecryptedMessage> => {
      if (message.unsentAt || !message.ciphertext) {
        return { ...message, plainText: null };
      }
      if (message.senderId === currentUserId) {
        return { ...message, plainText: null };
      }
      try {
        const keys = await loadPeerKeys(peerUserId);
        const plainText = await decryptFromPeer(
          peerUserId,
          keys.identity,
          keys.signed,
          message.ciphertext,
          message.nonce,
          message.header,
        );
        return { ...message, plainText };
      } catch {
        return { ...message, plainText: '[Unable to decrypt on this device]' };
      }
    },
    [currentUserId, loadPeerKeys],
  );

  const decryptLastMessage = React.useCallback(
    async (conversation: MessengerConversationDto, message: MessengerMessageDto) => {
      const cached = historyByConversationId[conversation.id]?.find((m) => m.id === message.id);
      if (cached?.plainText) {
        return cached.plainText;
      }
      const decrypted = await decryptMessage(message, conversation.peer.userId);
      return decrypted.plainText;
    },
    [decryptMessage, historyByConversationId],
  );

  const { previews, warmAll, updateFromPlainText } = useMessengerPreviewCache(decryptLastMessage);

  const loadThread = React.useCallback(
    async (conversationId: string, peerUserId: string) => {
      const page = await fetchMessages(conversationId);
      const sorted = [...page.items].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const keys = await loadPeerKeys(peerUserId);
      const plainTexts = await decryptThreadForPeer(
        peerUserId,
        keys.identity,
        keys.signed,
        sorted,
        currentUserId,
      );
      const decrypted = sorted.map((m, index) => ({
        ...m,
        plainText: plainTexts[index] ?? null,
      }));
      setMessages(decrypted);
      setHistoryByConversationId((prev) => ({ ...prev, [conversationId]: decrypted }));
      const socket = await getMessengerSocket();
      await socket.emitWithAck('conversation:join', { conversationId });
    },
    [currentUserId, loadPeerKeys],
  );

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await buildPublishKeysPayload();
        await publishMessengerKeys(payload);
        const identity = await getLocalIdentityPublicKey();
        if (!cancelled) {
          setLocalIdentity(identity);
        }
        await refreshConversations();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshConversations]);

  React.useEffect(() => {
    if (conversations.length > 0) {
      warmAll(conversations);
    }
  }, [conversations, warmAll]);

  React.useEffect(() => {
    let cancelled = false;
    let socketInstance: Awaited<ReturnType<typeof getMessengerSocket>> | null = null;

    const onConvUpdated = () => {
      void refreshConversations();
    };

    const onNew = async (message: MessengerMessageDto) => {
        const conv =
          active?.id === message.conversationId
            ? active
            : conversations.find((c) => c.id === message.conversationId);
        const peerUserId = conv?.peer.userId;
        if (!peerUserId) {
          void refreshConversations();
          return;
        }
        const decrypted = await decryptMessage(message, peerUserId);
        if (active?.id === message.conversationId) {
          setMessages((prev) => [...prev, decrypted]);
        }
        setHistoryByConversationId((prev) => {
          const existing = prev[message.conversationId] ?? [];
          return { ...prev, [message.conversationId]: [...existing, decrypted] };
        });
        updateFromPlainText(
          message.conversationId,
          decrypted.plainText,
          Boolean(message.unsentAt),
        );
        void refreshConversations();
    };

    const onUpdated = async (message: MessengerMessageDto) => {
        const conv =
          active?.id === message.conversationId
            ? active
            : conversations.find((c) => c.id === message.conversationId);
        const peerUserId = conv?.peer.userId;
        if (!peerUserId) {
          void refreshConversations();
          return;
        }
        const decrypted = await decryptMessage(message, peerUserId);
        if (active?.id === message.conversationId) {
          setMessages((prev) => prev.map((m) => (m.id === message.id ? decrypted : m)));
        }
        setHistoryByConversationId((prev) => {
          const existing = prev[message.conversationId] ?? [];
          return {
            ...prev,
            [message.conversationId]: existing.map((m) => (m.id === message.id ? decrypted : m)),
          };
        });
        updateFromPlainText(
          message.conversationId,
          decrypted.plainText,
          Boolean(message.unsentAt),
        );
    };

    void getMessengerSocket().then((socket) => {
      if (cancelled) {
        return;
      }
      socketInstance = socket;
      socket.on('message:new', onNew);
      socket.on('message:updated', onUpdated);
      socket.on('conversation:updated', onConvUpdated);
    });

    return () => {
      cancelled = true;
      if (socketInstance) {
        socketInstance.off('message:new', onNew);
        socketInstance.off('message:updated', onUpdated);
        socketInstance.off('conversation:updated', onConvUpdated);
      }
    };
  }, [
    active,
    conversations,
    decryptMessage,
    refreshConversations,
    updateFromPlainText,
  ]);

  const displayedSafetyNumber = React.useMemo(() => {
    if (!active || !localIdentity) {
      return null;
    }
    const keys = peerKeys[active.peer.userId];
    if (!keys) {
      return null;
    }
    return formatMessengerSafetyNumber(
      localIdentity,
      keys.identity,
      currentUserId,
      active.peer.userId,
    );
  }, [active, currentUserId, localIdentity, peerKeys]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const conversationMatchesSearch = React.useCallback(
    (conversation: MessengerConversationDto) => {
      if (!normalizedSearch) {
        return true;
      }
      const label = formatMessengerPeerLabel(conversation.peer).toLowerCase();
      if (label.includes(normalizedSearch)) {
        return true;
      }
      const preview = previews[conversation.id];
      if (preview?.plainText?.toLowerCase().includes(normalizedSearch)) {
        return true;
      }
      const history = historyByConversationId[conversation.id];
      if (history?.some((m) => m.plainText?.toLowerCase().includes(normalizedSearch))) {
        return true;
      }
      return false;
    },
    [historyByConversationId, normalizedSearch, previews],
  );

  const filtered = conversations.filter(
    (c) => (folder === 'ALL' || c.folder === folder) && conversationMatchesSearch(c),
  );

  const displayedMessages = React.useMemo(() => {
    if (!normalizedSearch) {
      return messages;
    }
    return messages.filter((m) => m.plainText?.toLowerCase().includes(normalizedSearch));
  }, [messages, normalizedSearch]);

  async function selectConversation(conversation: MessengerConversationDto) {
    setActiveId(conversation.id);
    setMobilePane('thread');
    const keys = await loadPeerKeys(conversation.peer.userId);
    void reportPeerIdentity({
      peerUserId: conversation.peer.userId,
      identityFingerprint: identityKeyFingerprint(keys.identity),
    });
    await loadThread(conversation.id, conversation.peer.userId);
  }

  async function persistEncryptedMessage(
    conversationId: string,
    encrypted: { ciphertext: string; nonce: string; header: Record<string, unknown> },
    editingMessageId: string | null,
  ): Promise<MessengerMessageDto> {
    const socketErrors: string[] = [];

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const socket = await getMessengerSocket();
        await messengerEmitWithAck(socket, 'conversation:join', { conversationId });
        const event = editingMessageId ? 'message:edit' : 'message:send';
        const payload = editingMessageId
          ? { messageId: editingMessageId, ...encrypted }
          : { conversationId, ...encrypted };
        const raw = await messengerEmitWithAck<unknown>(socket, event, payload);
        const ack = parseMessengerSendAck(raw);
        if (ack.message) {
          return ack.message;
        }
        if (ack.error === 'UNAUTHORIZED') {
          disconnectMessengerSocket();
          continue;
        }
        socketErrors.push(ack.error ?? 'SEND_FAILED');
      } catch (error) {
        disconnectMessengerSocket();
        socketErrors.push(error instanceof Error ? error.message : 'SOCKET_ERROR');
      }
    }

    if (editingMessageId) {
      throw new Error('Could not edit message. Refresh the page and try again.');
    }

    try {
      const saved = await sendEncryptedMessage(conversationId, encrypted);
      return saved;
    } catch (restError: unknown) {
      const detail = socketErrors[0];
      if (restError instanceof Error) {
        const message = detail ? `${restError.message} (${detail})` : restError.message;
        if (message !== restError.message) {
          throw new Error(message, { cause: restError });
        }
      }
      throw restError;
    }
  }

  async function sendMessage() {
    if (!active || !composer.trim() || sending) {
      return;
    }
    setSending(true);
    setSendError(null);
    const plain = composer.trim();
    const conversationId = active.id;
    const peerUserId = active.peer.userId;
    const editingMessageId = editingId;
    try {
      const keys = await loadPeerKeys(peerUserId);
      const encrypted = await encryptForPeer(peerUserId, keys.identity, keys.signed, plain);
      const saved = await persistEncryptedMessage(conversationId, encrypted, editingMessageId);
      const decrypted: DecryptedMessage = { ...saved, plainText: plain };
      setComposer('');
      setEditingId(null);
      if (editingMessageId) {
        setMessages((prev) => prev.map((m) => (m.id === saved.id ? decrypted : m)));
        setHistoryByConversationId((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] ?? []).map((m) =>
            m.id === saved.id ? decrypted : m,
          ),
        }));
      } else {
        setMessages((prev) => [...prev, decrypted]);
        setHistoryByConversationId((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] ?? []), decrypted],
        }));
      }
      updateFromPlainText(conversationId, plain);
      await refreshConversations();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  }

  async function startConversation(username: string) {
    setNewChatBusy(true);
    try {
      const conversation = await createConversation({ username });
      setNewChatOpen(false);
      await refreshConversations();
      await selectConversation(conversation);
    } finally {
      setNewChatBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-300">Loading encrypted messenger…</p>
    );
  }

  return (
    <>
      <MessengerNewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onStart={startConversation}
        busy={newChatBusy}
      />
      <div className="flex h-[min(78vh,720px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm lg:flex-row">
        <aside
          className={cn(
            'flex w-full flex-col border-[var(--border)] lg:w-80 lg:border-r',
            mobilePane !== 'list' && 'hidden lg:flex',
          )}
        >
          <div className="border-b border-[var(--border)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Messenger</p>
            <div className="mt-2 flex items-center gap-1">
              <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                {FOLDERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFolder(f.id)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium transition',
                      folder === f.id
                        ? 'bg-[var(--color-brand-700)] text-white'
                        : 'bg-[var(--muted)] text-slate-300 hover:text-[var(--foreground)]',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="New message"
                onClick={() => setNewChatOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-white shadow-sm transition hover:bg-[var(--color-brand-800)]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats and messages"
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-2 text-sm"
              />
            </label>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-400">
                {normalizedSearch
                  ? `No chats or messages match “${searchQuery.trim()}”.`
                  : 'No conversations in this folder.'}
              </li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void selectConversation(c)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition',
                      activeId === c.id ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]/60',
                    )}
                  >
                    <PeerAvatar peer={c.peer} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-[var(--foreground)]">
                          {formatMessengerPeerLabel(c.peer)}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              c.peer.isOnline ? 'bg-emerald-500' : 'bg-slate-500',
                            )}
                            aria-hidden
                          />
                          {c.unreadCount > 0 ? (
                            <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                              {c.unreadCount}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        {listPreviewSubtitle(c, previews[c.id])}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <section
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            mobilePane !== 'thread' && 'hidden lg:flex',
          )}
        >
          {active ? (
            <>
              <header className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    className="mb-1 text-xs text-slate-400 lg:hidden"
                    onClick={() => setMobilePane('list')}
                  >
                    ← Back
                  </button>
                  <h2 className="truncate text-sm font-semibold text-[var(--foreground)]">
                    {formatMessengerPeerLabel(active.peer)}
                  </h2>
                  <p className="truncate text-xs text-slate-400">
                    {(() => {
                      const subtitle = formatMessengerPeerSubtitle(active.peer);
                      return subtitle ? <>{subtitle} · </> : null;
                    })()}
                    {active.peer.isOnline ? 'Online' : 'Offline'} · encrypted
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {active.folder === 'REQUESTS' ? (
                    <button
                      type="button"
                      className="rounded-lg bg-[var(--color-brand-700)] px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => void acceptMessageRequest(active.id).then(refreshConversations)}
                    >
                      Accept
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-slate-300"
                    onClick={() => setMobilePane('profile')}
                  >
                    Profile
                  </button>
                </div>
              </header>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {displayedMessages.length === 0 && normalizedSearch ? (
                  <p className="text-center text-sm text-slate-400">
                    No messages in this chat match “{searchQuery.trim()}”.
                  </p>
                ) : null}
                {displayedMessages.map((m) => {
                  const mine = m.senderId === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3 py-2',
                          mine
                            ? 'bg-[var(--color-brand-700)] text-white'
                            : 'bg-[var(--muted)] text-[var(--foreground)]',
                        )}
                      >
                        {m.unsentAt ? (
                          <p className="text-xs italic opacity-80">Message unsent</p>
                        ) : m.plainText ? (
                          <MessageRichContent text={m.plainText} />
                        ) : (
                          <p className="text-xs italic opacity-80">Encrypted</p>
                        )}
                        {m.editedAt ? (
                          <p className="mt-1 text-[10px] opacity-70">Edited</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {MESSENGER_REACTION_EMOJI.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="rounded px-1 text-xs hover:bg-[var(--muted)]"
                            onClick={() => {
                              void getMessengerSocket().then((s) =>
                                s.emitWithAck('message:react', { messageId: m.id, emoji }),
                              );
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                        {mine && !m.unsentAt ? (
                          <>
                            <button
                              type="button"
                              className="text-[10px] text-slate-400 underline"
                              onClick={() => {
                                setEditingId(m.id);
                                setComposer(m.plainText ?? '');
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-[10px] text-slate-400 underline"
                              onClick={() => {
                                void getMessengerSocket().then((s) =>
                                  s.emitWithAck('message:unsend', { messageId: m.id }),
                                );
                              }}
                            >
                              Unsend
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <footer className="border-t border-[var(--border)] p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={composer}
                    onChange={(e) => {
                      setComposer(e.target.value);
                      if (sendError) {
                        setSendError(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    rows={2}
                    placeholder={editingId ? 'Edit message…' : 'Write a message…'}
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                    disabled={sending}
                  />
                  <button
                    type="button"
                    aria-label="Send"
                    disabled={sending || !composer.trim()}
                    onClick={() => void sendMessage()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-700)] text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <HiOutlinePaperAirplane className="h-5 w-5" />
                  </button>
                </div>
                {sendError ? (
                  <p className="mt-2 text-xs text-red-400" role="alert">
                    {sendError}
                  </p>
                ) : null}
                <p className="mt-2 text-[10px] text-slate-400">
                  Messages are encrypted on your device before they leave the browser. New devices cannot
                  read past history without keys stored here.
                </p>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-300">
              Select a conversation or tap + to start a new message
            </div>
          )}
        </section>

        <aside
          className={cn(
            'w-full border-[var(--border)] p-4 lg:w-72 lg:border-l',
            mobilePane !== 'profile' && 'hidden lg:block',
          )}
        >
          {active ? (
            <div className="space-y-4">
              <button
                type="button"
                className="text-xs text-slate-400 lg:hidden"
                onClick={() => setMobilePane('thread')}
              >
                ← Back to chat
              </button>
              <div className="flex items-center gap-3 rounded-xl bg-[var(--color-brand-800)] p-4 text-white">
                <PeerAvatar peer={active.peer} className="h-12 w-12" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {formatMessengerPeerLabel(active.peer)}
                  </p>
                  <p className="truncate text-xs text-slate-300">
                    @{active.peer.username ?? 'member'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Safety number
                </p>
                <p className="mt-1 font-mono text-xs leading-relaxed text-slate-300">
                  {displayedSafetyNumber ?? '—'}
                </p>
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
                      refreshConversations,
                    )
                  }
                >
                  Block user
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">Peer details appear when a chat is open.</p>
          )}
        </aside>
      </div>
    </>
  );
}
