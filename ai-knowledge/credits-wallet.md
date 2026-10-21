# Credit wallet and points history

Members earn **points** in a per-user `CreditWallet`. Transaction rows live in `CreditTransaction` (see `packages/db/prisma/schema.prisma`).

## API (JWT)

Nest module [`apps/api/src/wallet/`](../apps/api/src/wallet/):

| Method | Path | Role |
| ------ | ---- | ---- |
| GET | `/v1/wallet` | Balance, `checkInTimeZone` from profile, wallet `currency` if row exists |
| GET | `/v1/wallet/transactions` | Paginated history; query `limit` (default 50, max 100), `cursor` (base64url `createdAt\|id`) |

Shared DTOs and display helpers: [`packages/shared-types/src/credits.ts`](../packages/shared-types/src/credits.ts).

**Writers today:** daily check-in ([`check-in.service.ts`](../apps/api/src/check-in/check-in.service.ts)) — `BONUS`, reference `daily-check-in`. Signed amounts: earn `BONUS`/`REFUND`, deduct `PURCHASE`/`PROPOSAL_SENT`, `ADJUSTMENT` uses stored sign.

## Web

- Route: `/dashboard/profile/transactions` — [`profile-transactions.tsx`](../apps/web/components/dashboard/profile-transactions.tsx)
- BFF: `apps/web/app/api/wallet`, `.../wallet/transactions`
- **My Profile** hero ([`profile-hero-card.tsx`](../apps/web/components/dashboard/profile-hero-card.tsx)): points balance + **View history** link

Timestamps on the history page use `Profile.checkInTimeZone` (same as daily check-in); fallback UTC. Helpers: `formatCreditTransactionTime`, `effectiveCheckInTimeZone`.

## Related

- Daily check-in env and BullMQ inactivity: [check-in-inactivity.md](./check-in-inactivity.md)
