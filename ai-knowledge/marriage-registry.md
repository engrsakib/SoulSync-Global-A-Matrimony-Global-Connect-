# Marriage registry (encrypted spouse + children)

Private marriage history on own biodata, separate from guardian pledges and complementary to [`marriage-confirmation.md`](marriage-confirmation.md) (public dates / mutual SoulSync link).

## Rules

- Card always visible on own biodata ([`confirm-marriage-section.tsx`](../apps/web/components/dashboard/confirm-marriage-section.tsx)); not required for biodata completeness.
- **Male:** up to **4** slots; after slot _N_ is **confirmed**, checkbox **“I want a [second/third/fourth] marriage”** reveals slot _N+1_.
- **Female:** **1** slot (husband labeling).
- **Draft** → **Confirm** with irreversible ack dialog; after lock only **DIVORCED** or **DECEASED** status changes (history retained).
- **Confirm** requires spouse name, marriage date, valid mobile; optional Telegram/WhatsApp, optional SoulSync username, optional children.
- On confirm, syncs [`MarriageConfirmation`](../packages/db/prisma/schema.prisma) (solo date or mutual pending) for public biodata dates.
- PII encrypted with `BIODATA_MASTER_KEY` via [`FieldEncryptionService`](../apps/api/src/crypto/field-encryption.service.ts) (`spouseNameEnc`, phone, messaging, `childrenEnc` JSON blob).

## API (`/v1/marriage-records`, JWT)

| Method | Path                                         | Purpose                           |
| ------ | -------------------------------------------- | --------------------------------- |
| GET    | `/marriage-records/me`                       | Decrypted records + slot metadata |
| PUT    | `/marriage-records/slots/:slotIndex`         | Upsert DRAFT                      |
| POST   | `/marriage-records/slots/:slotIndex/confirm` | Lock + SoulSync sync              |
| PATCH  | `/marriage-records/:id/status`               | `DIVORCED` \| `DECEASED`          |

Web BFF: `apps/web/app/api/marriage-records/` · client [`marriage-record-api.ts`](../apps/web/lib/marriage-record-api.ts)

Shared types: `@soulsync/shared-types/marriage-record`

## Model

`MarriageRecord` — `@@unique([userId, slotIndex])`, statuses `DRAFT` | `CONFIRMED` | `DIVORCED` | `DECEASED`, optional `marriageConfirmationId` FK.
