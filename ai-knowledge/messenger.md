# Messenger (`/dashboard/messenger`)

End-to-end encrypted 1:1 messaging for logged-in members. Plaintext never persists on the server; Nest stores ciphertext, nonce, and opaque JSON headers only.

## Stack

| Layer | Location |
| ----- | -------- |
| REST + Socket.io | [`apps/api/src/messenger/`](../apps/api/src/messenger/) namespace `/messenger` |
| Redis | Presence, socket map, unread hash, OG preview cache |
| Web UI | [`apps/web/components/messenger/`](../apps/web/components/messenger/) |
| Client crypto | [`apps/web/lib/messenger/crypto/`](../apps/web/lib/messenger/crypto/) (Web Crypto, IndexedDB `soulsync-messenger-keys`) |
| BFF | [`apps/web/app/api/messenger/`](../apps/web/app/api/messenger/) |

Socket auth: `POST /v1/messenger/socket-ticket` (JWT `typ: socket`, ~2 min) → `socket.io-client` to API origin (`NEXT_PUBLIC_API_URL` without `/v1`). Global HTTP success/error envelope interceptors skip non-`http` contexts (`TransformResponseInterceptor`, `ApiHttpExceptionFilter`; `resolveRequestId` tolerates missing Express `req`).

## Privacy

- **Block** — either direction; biodata member view/preview returns not found ([`biodata-view.service.ts`](../apps/api/src/biodata/biodata-view.service.ts)).
- **Restrict** — recipient sees new threads in **Requests** until accept.

## Security code

Safety number: SHA-256 of sorted identity public keys ([`messenger-safety-number.ts`](../packages/shared-types/src/messenger-safety-number.ts)). Client reports fingerprint via `POST /messenger/peer-identity`; `MESSENGER_SECURITY_CODE_CHANGED` notification when peer identity key changes.

## Rich media

After decrypt, client detects YouTube URLs ([`messenger-youtube.ts`](../packages/shared-types/src/messenger-youtube.ts)), single GIF URLs ([`detect-gif-url.ts`](../apps/web/lib/messenger/detect-gif-url.ts)), or fetches OG preview via SSRF-safe `GET /messenger/link-preview`. Composer GIF search: BFF `GET /api/messenger/giphy/search` → API `GET /messenger/giphy/search` (requires `GIPHY_API_KEY` in **`apps/api/.env`**). Picker browse mode (before search): up to **12** GIFs — **Last used** from `localStorage` (`messenger-giphy-recent-v1`), or **Trending** from `GET /messenger/giphy/trending` when empty; 4×3 grid on large screens. Search returns max 12 results.

## DB

Prisma models `Messenger*` + migrations `20261026200000_messenger`, `20261026210000_messenger_scheduled`. Apply with `pnpm --filter @soulsync/db db:deploy`.

## Layout (Facebook-style, SoulSync tokens)

- **Shell** — [`messenger-app.client.tsx`](../apps/web/components/messenger/messenger-app.client.tsx): three columns on `lg+` (list `lg:w-72` / `xl:w-80` | thread `flex-1` min ~18rem | details `lg:w-[300px]` / `xl:w-[360px]`). Below `xl` (1280px), details **auto-close** via `matchMedia` so the thread column stays usable; reopen with Info. Height `calc(100dvh - var(--dashboard-messenger-offset))` (9rem mobile / 10.5rem md+ on [`page.tsx`](../apps/web/app/(dashboard)/dashboard/messenger/page.tsx)); messenger route uses tighter [`dashboard-shell`](../apps/web/components/dashboard/dashboard-shell.tsx) padding and edge-to-edge card below `sm`.
- **Composer** — [`messenger-composer.tsx`](../apps/web/components/messenger/messenger-composer.tsx): single-line auto-grow textarea (max ~128px), compact `h-9` controls, round send on mobile (schedule via long-press Send), send+schedule stack from `md+`; schedule hint hidden below `md`.
- **Chats column** — “Chats” header, encryption subline, folder pills, `#messenger-search` round search, **+** new chat.
- **Thread header** — [`messenger-thread-header.tsx`](../apps/web/components/messenger/messenger-thread-header.tsx): peer status; phone/video open [`messenger-call-coming-soon-dialog.tsx`](../apps/web/components/messenger/messenger-call-coming-soon-dialog.tsx) (coming-soon modal); **Info** toggles details (`detailsOpen`, default open on conversation change; mobile opens `profile` pane).
- **Details panel** — [`messenger-profile-panel.tsx`](../apps/web/components/messenger/messenger-profile-panel.tsx) + [`messenger-details-section.tsx`](../apps/web/components/messenger/messenger-details-section.tsx): hero avatar, Search (focuses list search; on mobile switches to list pane), mute placeholder, accordions (Chat info + safety copy/copy, Customize theme swatches, Scheduled, Privacy restrict/block). Biodata link via [`memberRoutes.memberBiodata`](../apps/web/lib/member-routes.ts). Avatars: [`messenger-peer-avatar.tsx`](../apps/web/components/messenger/messenger-peer-avatar.tsx).

## Sidebar UX

- **Peer labels** — API decrypts biodata fields in `MessengerService.listConversations` (`resolveEditorGrantMemberLabel` + `FieldEncryptionService`). Web uses [`formatMessengerPeerLabel`](../apps/web/lib/messenger/format-peer-label.ts) so `enc:v1:` never renders.
- **Last-message previews** — client background-decrypts each row’s `lastMessage` ([`use-messenger-preview-cache.ts`](../apps/web/lib/messenger/use-messenger-preview-cache.ts)); list subtitle shows truncated plaintext when available.
- **Search** — sidebar field filters by peer label, cached last-message preview, and plaintext from threads the user has opened (`historyByConversationId`). Active thread bubbles filter by the same query.
- **New chat** — **+** opens [`messenger-new-chat-dialog.tsx`](../apps/web/components/messenger/messenger-new-chat-dialog.tsx) with [`UsernameMemberSuggestInput`](../apps/web/components/dashboard/username-member-suggest-input.tsx) (editor-grants member search BFF).
- **Send path** — prefer `message:send` over Socket.io after `conversation:join`; on failure use `POST /messenger/conversations/:id/messages` (BFF). Client uses separate send/recv chain keys and thread replay in [`key-store.ts`](../apps/web/lib/messenger/crypto/key-store.ts). Session rows use inline IDB key `peerUserId` (no explicit `put` key). Failed socket connects reset in [`socket-client.ts`](../apps/web/lib/messenger/socket-client.ts).

## E2EE session (v2)

- **Shared root** — symmetric ECDH on peer **identity** public keys only (`header.v: 2`). Legacy v1 (identity + signed prekey mix) replayed for old ciphertext only.
- **Decrypt pipeline** — all UI paths merge by message id and full-thread replay via [`decrypt-messages.ts`](../apps/web/lib/messenger/decrypt-messages.ts); sent plaintext fallback in IDB [`plaintext-cache.ts`](../apps/web/lib/messenger/plaintext-cache.ts).
- **Real-time** — `message:new` / `message:updated` re-replay thread; gateway emits `message:new` to `conv:{id}` and `user:{recipientId}`. Socket handlers use refs so listeners stay stable across renders.
- **Security UX** — WhatsApp-style [`MessengerSystemLine`](../apps/web/components/messenger/messenger-system-line.tsx) (E2EE notice + security-code-changed copy). `peerIdentityFingerprint` on conversation list DTO; session cleared on identity change + `safety:notify` socket.
- **Message actions** — Hover bubble → [`messenger-message-hover-react.tsx`](../apps/web/components/messenger/messenger-message-hover-react.tsx) (smile icon toward thread center); [`messenger-message-actions.tsx`](../apps/web/components/messenger/messenger-message-actions.tsx): floating card (emoji row + divided Edit/Unsend for own messages), ⋯ toggle, click-outside dismiss. Reactions render as pills under bubbles ([`messenger-message-reactions.tsx`](../apps/web/components/messenger/messenger-message-reactions.tsx)); `message:react` ack + `message:updated` to `conv:{id}` and each participant `user:{id}` ([`patch-message-update.ts`](../apps/web/lib/messenger/patch-message-update.ts) preserves decrypted plaintext).
- **Composer** — [`messenger-composer.tsx`](../apps/web/components/messenger/messenger-composer.tsx): emoji popover, Giphy picker, send + schedule chevron / right-click send → [`messenger-schedule-dialog.tsx`](../apps/web/components/messenger/messenger-schedule-dialog.tsx).
- **Scheduled sends** — Prisma `MessengerScheduledMessage` + BullMQ queue `messenger-scheduled-messages` ([`messenger-scheduled.service.ts`](../apps/api/src/messenger/messenger-scheduled.service.ts)): draft plaintext field-encrypted at rest until fire; processor emits `schedule:deliver` to `user:{senderId}`; client fetches `GET /messenger/scheduled/:id`, encrypts, sends, `POST …/sent`. REST list/create under `conversations/:id/scheduled`; BFF mirrors under [`apps/web/app/api/messenger/`](../apps/web/app/api/messenger/). Max horizon `MESSENGER_SCHEDULE_MAX_DAYS` (default 30).
- **Profile panel** — scheduled list CRUD + per-chat themes ([`messenger-chat-themes.ts`](../apps/web/lib/messenger/messenger-chat-themes.ts), `localStorage` key `messenger-theme:{conversationId}`); see **Layout** above for shell behavior.
