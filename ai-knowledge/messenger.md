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

After decrypt, client detects YouTube URLs ([`messenger-youtube.ts`](../packages/shared-types/src/messenger-youtube.ts)) or fetches OG preview via SSRF-safe `GET /messenger/link-preview`.

## DB

Prisma models `Messenger*` + migration `20261026200000_messenger`. Apply with `pnpm --filter @soulsync/db db:deploy`.

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
