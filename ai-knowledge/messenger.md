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

Socket auth: `POST /v1/messenger/socket-ticket` (JWT `typ: socket`, ~2 min) → `socket.io-client` to API origin (`NEXT_PUBLIC_API_URL` without `/v1`).

## Privacy

- **Block** — either direction; biodata member view/preview returns not found ([`biodata-view.service.ts`](../apps/api/src/biodata/biodata-view.service.ts)).
- **Restrict** — recipient sees new threads in **Requests** until accept.

## Security code

Safety number: SHA-256 of sorted identity public keys ([`messenger-safety-number.ts`](../packages/shared-types/src/messenger-safety-number.ts)). Client reports fingerprint via `POST /messenger/peer-identity`; `MESSENGER_SECURITY_CODE_CHANGED` notification when peer identity key changes.

## Rich media

After decrypt, client detects YouTube URLs ([`messenger-youtube.ts`](../packages/shared-types/src/messenger-youtube.ts)) or fetches OG preview via SSRF-safe `GET /messenger/link-preview`.

## DB

Prisma models `Messenger*` + migration `20261026200000_messenger`. Apply with `pnpm --filter @soulsync/db db:deploy`.
