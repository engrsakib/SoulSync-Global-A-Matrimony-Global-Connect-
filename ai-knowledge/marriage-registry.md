# Marriage registry (encrypted spouse + children)

Private marriage history on own biodata, separate from guardian pledges and complementary to [`marriage-confirmation.md`](marriage-confirmation.md) (public dates / mutual SoulSync link).

**Public member biodata header:** `MemberBiodataViewDto.familySummary` — active spouse count + children count badges with tooltip (current / divorced / deceased spouse lines; sons/daughters counts only). Registry spouse names in tooltip when set; SoulSync partner names follow `showMarriagePartnerOnPublicBiodata`.

**Public Confirm marriage section:** `confirmMarriagePanel` — same read layout as own biodata (current marriages, named children, history); API strips draft rows and phone/Telegram/WhatsApp; never exposes registry contact fields.

## Rules

- Card always visible on own biodata ([`confirm-marriage-section.tsx`](../apps/web/components/dashboard/confirm-marriage-section.tsx)); not required for biodata completeness.
- **History labels (private spouse):** `{name} · {ordinal} wife · Not on SoulSync` (same as mother dropdown minus status) plus **status badge**; matched by `marriageConfirmationId` or marriage date fallback (`formatRegistrySpouseOptionLabel`).
- **UI zones:** registry block shows **Current** confirmed marriages (+ draft chips in edit mode) only; read mode adds a view-only **Children** list ([`confirm-marriage-children-summary.tsx`](../apps/web/components/dashboard/confirm-marriage-children-summary.tsx)) when any child exists (name, age as years/months/days, mother); **History** on the card merges SoulSync ended rows, registry DIVORCED/DECEASED, and archives (no separate “Past marriages” / “Additional marriage dates” lists).
- **Male:** up to **4 concurrent CONFIRMED** registry wives (divorced/deceased do not count). **Capacity** for Accept / confirm / begin-remarriage uses **registry `CONFIRMED` count only** — legacy unlinked SoulSync `CONFIRMED` rows do not block new wives (`countActiveConfirmedMarriagesForCapacity` API; `countActiveMarriagesForCapacity` in shared-types). Marking a registry row **DIVORCED** / **DECEASED** also ends the linked `MarriageConfirmation` when `marriageConfirmationId` is set. **Additional wives** checkboxes add a new slot when under the cap; **ended slots** reuse via `POST …/slots/:n/begin-remarriage` (archives prior wife, opens **DRAFT** on same slot). `resolveNextEditableMarriageSlot` in shared-types picks draft, then ended slot, then empty slot. Edit mode: spouse **draft** forms separate from **Family children** ([`marriage-registry-family-children.tsx`](../apps/web/components/dashboard/marriage-registry-family-children.tsx)).
- **Female:** **1** active husband; **Add new husband** archives the ended slot-1 row to `MarriageRecordArchive` and opens a new **DRAFT** on slot 1.
- **Draft** → **Confirm** with irreversible ack dialog; after lock only **DIVORCED** or **DECEASED** status changes (history retained). Marking divorced/deceased requires a **status end date** (`statusEndedAt` / `statusEndedDate` on DTO) via date picker dialog.
- **Children DOB:** must be ≥ **210 days** after the selected mother’s marriage date and on/before her divorce/death date (or today if marriage still active). Validated in UI and API (`validateChildDateOfBirth`). Mother context uses active rows **and** `archivedRecords` when the slot was remarried (female slot 1) or a draft replaced an ended wife without a name yet.
- **Child mother display:** `@soulsync/shared-types/marriage-record` — `resolveMotherSpouseDisplayNameForChild`, `buildMotherSpouseShortNameBySlot`, `flattenRegistryFamilyChildren`, `childrenForSpouseRegistryEntry` (History + locked cards: all children whose `motherSlotIndex` matches that spouse slot, not only the inline blob). Confirm/batch save preserve `motherSlotIndex` via `normalizeChildForStorage`.
- **Confirm** requires spouse name, marriage date, valid mobile; optional Telegram/WhatsApp, optional SoulSync username, optional children.
- On confirm, syncs [`MarriageConfirmation`](../packages/db/prisma/schema.prisma) (solo date or mutual pending) for public biodata dates.
- PII encrypted with `BIODATA_MASTER_KEY` via [`FieldEncryptionService`](../apps/api/src/crypto/field-encryption.service.ts) (`spouseNameEnc`, phone, messaging, `childrenEnc` JSON blob).

## API (`/v1/marriage-records`, JWT)

| Method | Path                                                  | Purpose                                                              |
| ------ | ----------------------------------------------------- | -------------------------------------------------------------------- |
| GET    | `/marriage-records/me`                                | Decrypted records + `archivedRecords` + `nextEditableSlot`           |
| PUT    | `/marriage-records/slots/:slotIndex`                  | Upsert DRAFT (children fan-out by `motherSlotIndex`)                 |
| DELETE | `/marriage-records/slots/:slotIndex`                  | Permanently delete DRAFT row for slot (blocked if later slots exist) |
| PUT    | `/marriage-records/me/children-batch`                 | Update draft children on multiple slots                              |
| POST   | `/marriage-records/slots/:slotIndex/begin-remarriage` | Female: archive ended slot 1 → new DRAFT                             |
| POST   | `/marriage-records/slots/:slotIndex/confirm`          | Lock + SoulSync sync                                                 |
| PATCH  | `/marriage-records/:id/status`                        | `DIVORCED` \| `DECEASED`                                             |

Web BFF: `apps/web/app/api/marriage-records/` · client [`marriage-record-api.ts`](../apps/web/lib/marriage-record-api.ts)

Shared types: `@soulsync/shared-types/marriage-record`

## Model

`MarriageRecord` — `@@unique([userId, slotIndex])`, statuses `DRAFT` | `CONFIRMED` | `DIVORCED` | `DECEASED`, optional `marriageConfirmationId` FK.

`MarriageRecordArchive` — snapshot when a female member starts a new husband on slot 1; listed in `GET /me` as `archivedRecords`.

Migration: `20261023170000_marriage_record_archive`.
