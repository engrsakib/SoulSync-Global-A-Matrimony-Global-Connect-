'use client';

import * as React from 'react';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import { cn } from '@soulsync/ui/lib/utils';
import type {
  MessengerConversationDto,
  MessengerMessageDto,
  MessengerParticipantFolderDto,
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
  setMessengerPrivacy,
} from '@/lib/messenger/messenger-api';
import {
  buildPublishKeysPayload,
  decryptFromPeer,
  encryptForPeer,
  getLocalIdentityPublicKey,
} from '@/lib/messenger/crypto/key-store';
import { publishMessengerKeys } from '@/lib/messenger/messenger-api';
import { getMessengerSocket } from '@/lib/messenger/socket-client';
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

export function MessengerAppClient({ currentUserId }: Props) {
  const [folder, setFolder] = React.useState<(typeof FOLDERS)[number]['id']>('ALL');
  const [conversations, setConversations] = React.useState<MessengerConversationDto[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<DecryptedMessage[]>([]);
  const [composer, setComposer] = React.useState('');
  const [newUsername, setNewUsername] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [mobilePane, setMobilePane] = React.useState<'list' | 'thread' | 'profile'>('list');
  const [editingId, setEditingId] = React.useState<string | null>(null);
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
    const cached = peerKeys[peerUserId];
    if (cached) {
      return cached;
    }
    const bundle = await fetchPeerKeyBundle(peerUserId);
    const entry = {
      identity: bundle.identityPublicKey,
      signed: bundle.signedPreKeyPublic,
    };
    setPeerKeys((prev) => ({ ...prev, [peerUserId]: entry }));
    return entry;
  }, [peerKeys]);

  const decryptMessage = React.useCallback(
    async (message: MessengerMessageDto, peerUserId: string): Promise<DecryptedMessage> => {
      if (message.unsentAt || !message.ciphertext) {
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
    [loadPeerKeys],
  );

  const loadThread = React.useCallback(
    async (conversationId: string, peerUserId: string) => {
      const page = await fetchMessages(conversationId);
      const decrypted = await Promise.all(page.items.map((m) => decryptMessage(m, peerUserId)));
      setMessages(decrypted);
      const socket = await getMessengerSocket();
      await socket.emitWithAck('conversation:join', { conversationId });
    },
    [decryptMessage],
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
    void getMessengerSocket().then((socket) => {
      const onNew = async (message: MessengerMessageDto) => {
        if (!active?.peer.userId) {
          return;
        }
        const decrypted = await decryptMessage(message, active.peer.userId);
        setMessages((prev) => [...prev, decrypted]);
        void refreshConversations();
      };
      const onUpdated = async (message: MessengerMessageDto) => {
        if (!active?.peer.userId) {
          return;
        }
        const decrypted = await decryptMessage(message, active.peer.userId);
        setMessages((prev) => prev.map((m) => (m.id === message.id ? decrypted : m)));
      };
      socket.on('message:new', onNew);
      socket.on('message:updated', onUpdated);
      socket.on('conversation:updated', () => {
        void refreshConversations();
      });
      return () => {
        socket.off('message:new', onNew);
        socket.off('message:updated', onUpdated);
      };
    });
  }, [active?.peer.userId, active?.id, decryptMessage, refreshConversations]);

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

  const filtered = conversations.filter((c) => folder === 'ALL' || c.folder === folder);

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

  async function sendMessage() {
    if (!active || !composer.trim()) {
      return;
    }
    const keys = await loadPeerKeys(active.peer.userId);
    const encrypted = await encryptForPeer(
      active.peer.userId,
      keys.identity,
      keys.signed,
      composer.trim(),
    );
    const socket = await getMessengerSocket();
    if (editingId) {
      await socket.emitWithAck('message:edit', {
        messageId: editingId,
        ...encrypted,
      });
      setEditingId(null);
    } else {
      await socket.emitWithAck('message:send', {
        conversationId: active.id,
        ...encrypted,
      });
    }
    setComposer('');
    await loadThread(active.id, active.peer.userId);
    await refreshConversations();
  }

  async function startConversation() {
    const username = newUsername.trim();
    if (!username) {
      return;
    }
    const conversation = await createConversation({ username });
    setNewUsername('');
    await refreshConversations();
    await selectConversation(conversation);
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-300">Loading encrypted messenger…</p>
    );
  }

  return (
    <div className="flex h-[min(78vh,720px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm lg:flex-row">
      <aside
        className={cn(
          'flex w-full flex-col border-[var(--border)] lg:w-80 lg:border-r',
          mobilePane !== 'list' && 'hidden lg:flex',
        )}
      >
        <div className="border-b border-[var(--border)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Messenger</p>
          <div className="mt-2 flex flex-wrap gap-1">
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
          <div className="mt-3 flex gap-2">
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="@username"
              className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void startConversation()}
              className="rounded-lg bg-[var(--color-brand-700)] px-3 text-xs font-semibold text-white"
            >
              New
            </button>
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => void selectConversation(c)}
                className={cn(
                  'flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition',
                  activeId === c.id ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]/60',
                )}
              >
                <span
                  className={cn(
                    'mt-1 h-2 w-2 shrink-0 rounded-full',
                    c.peer.isOnline ? 'bg-emerald-500' : 'bg-slate-500',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[var(--foreground)]">
                      {c.peer.displayName ?? c.peer.username ?? 'Member'}
                    </span>
                    {c.unreadCount > 0 ? (
                      <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {c.folder === 'REQUESTS' ? 'Message request' : 'End-to-end encrypted'}
                  </span>
                </span>
              </button>
            </li>
          ))}
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
              <div>
                <button
                  type="button"
                  className="mb-1 text-xs text-slate-400 lg:hidden"
                  onClick={() => setMobilePane('list')}
                >
                  ← Back
                </button>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  {active.peer.displayName ?? active.peer.username}
                </h2>
                <p className="text-xs text-slate-400">
                  {active.peer.isOnline ? 'Online' : 'Offline'} · encrypted
                </p>
              </div>
              <div className="flex gap-2">
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
              {messages.map((m) => {
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
                  onChange={(e) => setComposer(e.target.value)}
                  rows={2}
                  placeholder={editingId ? 'Edit message…' : 'Write a message…'}
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  aria-label="Send"
                  onClick={() => void sendMessage()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-700)] text-white"
                >
                  <HiOutlinePaperAirplane className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400">
                Messages are encrypted on your device before they leave the browser. New devices cannot
                read past history without keys stored here.
              </p>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-300">
            Select a conversation or start one with @username
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
            <div className="rounded-xl bg-[var(--color-brand-800)] p-4 text-white">
              <p className="text-sm font-semibold">{active.peer.displayName ?? active.peer.username}</p>
              <p className="text-xs text-slate-300">@{active.peer.username ?? 'member'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Safety number</p>
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
  );
}
