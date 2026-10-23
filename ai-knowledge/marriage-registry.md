# Marriage registry (encrypted spouse + children)

Private marriage history on own biodata, separate from guardian pledges and complementary to [`marriage-confirmation.md`](marriage-confirmation.md) (public dates / mutual SoulSync link).

## Rules

- Card always visible on own biodata ([`confirm-marriage-section.tsx`](../apps/web/components/dashboard/confirm-marriage-section.tsx)); not required for biodata completeness.
- **Male:** up to **4** active **CONFIRMED** slots; **Additional wives** checkboxes reveal slot _N+1_ when slot _N_ is **confirmed**, **divorced**, or **deceased**. Children on each wife form may pick **mother (wife)** when more than one wife has a name (`motherSlotIndex` stored per slot’s encrypted children JSON).
- **Female:** **1** active husband; **Add new husband** archives the ended slot-1 row to `MarriageRecordArchive` and opens a new **DRAFT** on slot 1.
- **Draft** → **Confirm** with irreversible ack dialog; after lock only **DIVORCED** or **DECEASED** status changes (history retained).
- **Confirm** requires spouse name, marriage date, valid mobile; optional Telegram/WhatsApp, optional SoulSync username, optional children.
- On confirm, syncs [`MarriageConfirmation`](../packages/db/prisma/schema.prisma) (solo date or mutual pending) for public biodata dates.
- PII encrypted with `BIODATA_MASTER_KEY` via [`FieldEncryptionService`](../apps/api/src/crypto/field-encryption.service.ts) (`spouseNameEnc`, phone, messaging, `childrenEnc` JSON blob).

## API (`/v1/marriage-records`, JWT)

| Method | Path                                                  | Purpose                                                    |
| ------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| GET    | `/marriage-records/me`                                | Decrypted records + `archivedRecords` + `nextEditableSlot` |
| PUT    | `/marriage-records/slots/:slotIndex`                  | Upsert DRAFT (children fan-out by `motherSlotIndex`)       |
| PUT    | `/marriage-records/me/children-batch`                 | Update draft children on multiple slots                    |
| POST   | `/marriage-records/slots/:slotIndex/begin-remarriage` | Female: archive ended slot 1 → new DRAFT                   |
| POST   | `/marriage-records/slots/:slotIndex/confirm`          | Lock + SoulSync sync                                       |
| PATCH  | `/marriage-records/:id/status`                        | `DIVORCED` \| `DECEASED`                                   |

Web BFF: `apps/web/app/api/marriage-records/` · client [`marriage-record-api.ts`](../apps/web/lib/marriage-record-api.ts)

Shared types: `@soulsync/shared-types/marriage-record`

## Model

`MarriageRecord` — `@@unique([userId, slotIndex])`, statuses `DRAFT` | `CONFIRMED` | `DIVORCED` | `DECEASED`, optional `marriageConfirmationId` FK.

`MarriageRecordArchive` — snapshot when a female member starts a new husband on slot 1; listed in `GET /me` as `archivedRecords`.

Migration: `20261023170000_marriage_record_archive`.
