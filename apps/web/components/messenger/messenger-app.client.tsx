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
  clearSession,
  encryptForPeer,
  getLocalIdentityPublicKey,
} from '@/lib/messenger/crypto/key-store';
import {
  decryptMessagesForThread,
  decryptPlaceholder,
  mergeMessagesById,
  type DecryptedMessage,
} from '@/lib/messenger/decrypt-messages';
import { rememberSentPlaintext } from '@/lib/messenger/plaintext-cache';
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
import { MessengerSystemLine } from './messenger-system-line';
import { MessengerMessageActions } from './messenger-message-actions';

type ThreadSystemLine = {
  id: string;
  conversationId: string;
  text: string;
};

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
  const [openActionsMessageId, setOpenActionsMessageId] = React.useState<string | null>(null);
  const peerKeysRef = React.useRef<
    Record<string, { identity: string; signed: string; fingerprint: string }>
  >({});
  const [peerKeys, setPeerKeys] = React.useState<
    Record<string, { identity: string; signed: string; fingerprint: string }>
  >({});
  const [localIdentity, setLocalIdentity] = React.useState<string | null>(null);
  const [threadSystemLines, setThreadSystemLines] = React.useState<
    Record<string, ThreadSystemLine[]>
  >({});

  const activeIdRef = React.useRef(activeId);
  const conversationsRef = React.useRef(conversations);
  const historyRef = React.useRef(historyByConversationId);

  React.useEffect(() => {
    activeIdRef.current = activeId;
    conversationsRef.current = conversations;
    historyRef.current = historyByConversationId;
  }, [activeId, conversations, historyByConversationId]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const pushThreadSystemLine = React.useCallback((conversationId: string, text: string) => {
    setThreadSystemLines((prev) => ({
      ...prev,
      [conversationId]: [
        ...(prev[conversationId] ?? []),
        { id: crypto.randomUUID(), conversationId, text },
      ],
    }));
  }, []);

  const refreshConversations = React.useCallback(async () => {
    const list = await fetchConversations();
    setConversations(list.items);
    conversationsRef.current = list.items;
    return list;
  }, []);

  const loadPeerKeys = React.useCallback(
    async (peerUserId: string) => {
      const bundle = await fetchPeerKeyBundle(peerUserId);
      const fingerprint = identityKeyFingerprint(bundle.identityPublicKey);
      const cached = peerKeysRef.current[peerUserId];
      if (cached && cached.identity !== bundle.identityPublicKey) {
        await clearSession(peerUserId);
      }
      const entry = {
        identity: bundle.identityPublicKey,
        signed: bundle.signedPreKeyPublic,
        fingerprint,
      };
      peerKeysRef.current[peerUserId] = entry;
      setPeerKeys((prev) => ({ ...prev, [peerUserId]: entry }));
      return entry;
    },
    [],
  );

  const decryptAndMerge = React.useCallback(
    async (
      conversationId: string,
      peerUserId: string,
      incoming: MessengerMessageDto[],
    ): Promise<DecryptedMessage[]> => {
      const keys = await loadPeerKeys(peerUserId);
      const merged = mergeMessagesById(historyRef.current[conversationId] ?? [], incoming);
      return decryptMessagesForThread(peerUserId, keys, merged, currentUserId);
    },
    [currentUserId, loadPeerKeys],
  );

  const updateFromPlainTextRef = React.useRef<
    (conversationId: string, plainText: string | null, unsent: boolean) => void
  >(() => {});

  const decryptLastMessage = React.useCallback(
    async (conversation: MessengerConversationDto, message: MessengerMessageDto) => {
      const cached = historyByConversationId[conversation.id]?.find((m) => m.id === message.id);
      if (cached?.plainText) {
        return cached.plainText;
      }
      const decrypted = await decryptAndMerge(conversation.id, conversation.peer.userId, [message]);
      const row = decrypted.find((m) => m.id === message.id);
      return row?.plainText ?? null;
    },
    [decryptAndMerge, historyByConversationId],
  );

  const { previews, warmAll, updateFromPlainText } = useMessengerPreviewCache(decryptLastMessage);

  React.useEffect(() => {
    updateFromPlainTextRef.current = updateFromPlainText;
  }, [updateFromPlainText]);

  const applyThreadDecryption = React.useCallback(
    (conversationId: string, decrypted: DecryptedMessage[]) => {
      setHistoryByConversationId((prev) => {
        const next = { ...prev, [conversationId]: decrypted };
        historyRef.current = next;
        return next;
      });
      if (activeIdRef.current === conversationId) {
        setMessages(decrypted);
      }
      const last = decrypted[decrypted.length - 1];
      if (last) {
        updateFromPlainTextRef.current(
          conversationId,
          last.plainText,
          Boolean(last.unsentAt),
        );
      }
    },
    [],
  );

  const loadThread = React.useCallback(
    async (conversationId: string, peerUserId: string) => {
      const page = await fetchMessages(conversationId);
      const decrypted = await decryptMessagesForThread(
        peerUserId,
        await loadPeerKeys(peerUserId),
        page.items,
        currentUserId,
      );
      applyThreadDecryption(conversationId, decrypted);
      const socket = await getMessengerSocket();
      await socket.emitWithAck('conversation:join', { conversationId });
    },
    [applyThreadDecryption, currentUserId, loadPeerKeys],
  );

  const syncActiveThreadFromServer = React.useCallback(async () => {
    const conversationId = activeIdRef.current;
    if (!conversationId) {
      return;
    }
    const conv = conversationsRef.current.find((c) => c.id === conversationId);
    if (!conv?.peer.userId) {
      return;
    }
    const page = await fetchMessages(conversationId);
    const decrypted = await decryptMessagesForThread(
      conv.peer.userId,
      await loadPeerKeys(conv.peer.userId),
      page.items,
      currentUserId,
    );
    applyThreadDecryption(conversationId, decrypted);
  }, [applyThreadDecryption, currentUserId, loadPeerKeys]);

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

    const resolveConversation = async (conversationId: string) => {
      let conv = conversationsRef.current.find((c) => c.id === conversationId);
      if (!conv) {
        const list = await refreshConversations();
        conv = list.items.find((c) => c.id === conversationId);
      }
      return conv ?? null;
    };

    const onConvUpdated = (payload?: { conversationId?: string }) => {
      void refreshConversations();
      const activeConvId = activeIdRef.current;
      if (
        activeConvId &&
        (!payload?.conversationId || payload.conversationId === activeConvId)
      ) {
        void syncActiveThreadFromServer();
      }
    };

    const onNew = async (message: MessengerMessageDto) => {
      const conv = await resolveConversation(message.conversationId);
      const peerUserId = conv?.peer.userId;
      if (!peerUserId) {
        return;
      }
      const decrypted = await decryptAndMerge(message.conversationId, peerUserId, [message]);
      applyThreadDecryption(message.conversationId, decrypted);
      void refreshConversations();
    };

    const onUpdated = async (message: MessengerMessageDto) => {
      const conv = await resolveConversation(message.conversationId);
      const peerUserId = conv?.peer.userId;
      if (!peerUserId) {
        return;
      }
      const decrypted = await decryptAndMerge(message.conversationId, peerUserId, [message]);
      applyThreadDecryption(message.conversationId, decrypted);
    };

    const onSafetyNotify = (payload: { peerUserId: string }) => {
      const conv = conversationsRef.current.find((c) => c.peer.userId === payload.peerUserId);
      if (!conv) {
        return;
      }
      const label = formatMessengerPeerLabel(conv.peer);
      pushThreadSystemLine(
        conv.id,
        `Your security code with ${label} changed. Open Profile to verify.`,
      );
      void clearSession(payload.peerUserId).then(() => {
        delete peerKeysRef.current[payload.peerUserId];
        if (activeIdRef.current === conv.id) {
          void syncActiveThreadFromServer();
        }
      });
    };

    void getMessengerSocket().then((socket) => {
      if (cancelled) {
        return;
      }
      socketInstance = socket;
      socket.on('message:new', onNew);
      socket.on('message:updated', onUpdated);
      socket.on('conversation:updated', onConvUpdated);
      socket.on('safety:notify', onSafetyNotify);
    });

    return () => {
      cancelled = true;
      if (socketInstance) {
        socketInstance.off('message:new', onNew);
        socketInstance.off('message:updated', onUpdated);
        socketInstance.off('conversation:updated', onConvUpdated);
        socketInstance.off('safety:notify', onSafetyNotify);
      }
    };
  }, [
    applyThreadDecryption,
    decryptAndMerge,
    pushThreadSystemLine,
    refreshConversations,
    syncActiveThreadFromServer,
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
    const identityReport = await reportPeerIdentity({
      peerUserId: conversation.peer.userId,
      identityFingerprint: keys.fingerprint,
    });
    if (identityReport.changed) {
      await clearSession(conversation.peer.userId);
      pushThreadSystemLine(
        conversation.id,
        `Your security code with ${formatMessengerPeerLabel(conversation.peer)} changed. Open Profile to verify.`,
      );
    }
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
      await rememberSentPlaintext(saved.id, plain);
      setComposer('');
      setEditingId(null);
      const decrypted = await decryptAndMerge(conversationId, peerUserId, [saved]);
      const withPlain = decrypted.map((m) =>
        m.id === saved.id ? { ...m, plainText: plain, decryptState: 'ok' as const } : m,
      );
      applyThreadDecryption(conversationId, withPlain);
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
                <MessengerSystemLine>
                  Messages and calls are end-to-end encrypted. No one outside of this chat, not even
                  SoulSync, can read them.
                </MessengerSystemLine>
                {(threadSystemLines[active.id] ?? []).map((line) => (
                  <MessengerSystemLine key={line.id}>{line.text}</MessengerSystemLine>
                ))}
                {displayedMessages.length === 0 && normalizedSearch ? (
                  <p className="text-center text-sm text-slate-400">
                    No messages in this chat match “{searchQuery.trim()}”.
                  </p>
                ) : null}
                {displayedMessages.map((m) => {
                  const mine = m.senderId === currentUserId;
                  const showActions = !m.unsentAt;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'group/msg flex max-w-[92%] flex-col gap-1',
                        mine ? 'ml-auto items-end' : 'items-start',
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-end gap-1',
                          mine ? 'flex-row-reverse' : 'flex-row',
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[min(85vw,28rem)] rounded-2xl px-3 py-2 shadow-sm',
                            mine
                              ? 'bg-[var(--color-brand-700)] text-white'
                              : 'bg-[var(--muted)] text-[var(--foreground)]',
                          )}
                        >
                          {m.unsentAt ? (
                            <p
                              className={cn(
                                'text-xs italic',
                                mine ? 'text-white/80' : 'opacity-80',
                              )}
                            >
                              Message unsent
                            </p>
                          ) : m.plainText ? (
                            <MessageRichContent
                              text={m.plainText}
                              variant={mine ? 'outgoing' : 'incoming'}
                            />
                          ) : (
                            <p
                              className={cn(
                                'text-xs italic',
                                mine ? 'text-white/80' : 'opacity-80',
                              )}
                            >
                              {decryptPlaceholder(m.decryptState)}
                            </p>
                          )}
                          {m.editedAt ? (
                            <p
                              className={cn(
                                'mt-1 text-[10px]',
                                mine ? 'text-white/70' : 'opacity-70',
                              )}
                            >
                              Edited
                            </p>
                          ) : null}
                        </div>
                        {showActions ? (
                          <MessengerMessageActions
                            messageId={m.id}
                            mine={mine}
                            align={mine ? 'end' : 'start'}
                            open={openActionsMessageId === m.id}
                            onOpenChange={(next) =>
                              setOpenActionsMessageId(next ? m.id : null)
                            }
                            onEdit={
                              mine
                                ? () => {
                                    setEditingId(m.id);
                                    setComposer(m.plainText ?? '');
                                  }
                                : undefined
                            }
                          />
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
