# Confirm marriage (mutual history + public badge)

Separate from guardian **marriage pledges** (`guardian_contact` biodata section). This flow links two tenant members by username with partner acceptance.

## Rules

- Dashboard **Confirm marriage** card is the **last** block on own biodata in [`biodata-builder.tsx`](../apps/web/components/dashboard/biodata-builder.tsx) (after all sections and gallery; not a `BIODATA_SECTION_IDS` section; not gated by section privacy). **Current SoulSync marriages** (mutual accept, read + edit) render as partner cards for both initiator and partner even when the registry slot is empty; registry-linked rows dedupe by `marriageConfirmationId`. **Registry** locked slots and **Children** summary follow; **History** merges SoulSync ended rows, registry DIVORCED/DECEASED, and archives. Pending lists and send-request form when editing; marriage date uses `@soulsync/ui/iso-date-picker` (same calendar UX as date of birth).
- Initiator must be **opposite gender** to partner (`Profile.gender`: MALE ↔ FEMALE).
- Each row has a required **marriage date** (`YYYY-MM-DD`, stored as `@db.Date`).
- Partner **accept** / **decline**; initiator can **cancel** while `PENDING`. **Cancel** and **decline** remove the row from the database (never confirmed).
- **Pending rows:** incoming/outgoing lists show the request card only (Accept/Decline/Cancel). Optional `GET …/review` API remains for future use; no dual-profile UI on the card.
- **History** lists only **DIVORCED** and **DECEASED** (confirmed marriages that ended). **CONFIRMED** rows are permanent until divorced/deceased.
- Public member biodata shows all **CONFIRMED** entries (partner name, date, link) in the top banner and in a read-only **Confirm marriage** `SectionCard` after **Guardian contact** (dashboard-equivalent read: current registry cards, Children list, History; no drafts or spouse contact fields; not section-gated). Payload: `MemberBiodataViewDto.confirmMarriagePanel`.
- **`Profile.hasConfirmedMarriage`**: set `true` for both users on accept; inactivity auto-private skips these profiles ([`check-in-inactivity.md`](check-in-inactivity.md)).

## Data model

- `MarriageConfirmation` — statuses `PENDING`, `CONFIRMED`, `DECLINED`, `CANCELLED`
- Unique `(initiatorUserId, partnerUserId, marriageDate)` (index `marriage_confirmations_initiator_partner_date_key`); API returns **400** with a clear message on duplicate (confirmed, pending same triple, or ended row still occupying the slot).

## API (JWT, prefix `/v1`)

Module [`apps/api/src/marriage-confirmation/`](../apps/api/src/marriage-confirmation/) imports `AuthModule` (controller uses `JwtAuthGuard` → `JwtTokenService`).

| Method | Path                                  | Behavior                                                                                                  |
| ------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| GET    | `/marriage-confirmations/me`          | Pending incoming/outgoing, confirmed, history                                                             |
| GET    | `/marriage-confirmations/:id/review`  | While `PENDING`, both parties’ decrypted registry + SoulSync confirmed/history (initiator + partner only) |
| POST   | `/marriage-confirmations`             | Body `{ partnerUsername, marriageDate }`                                                                  |
| POST   | `/marriage-confirmations/:id/accept`  | Partner only                                                                                              |
| POST   | `/marriage-confirmations/:id/decline` | Partner only                                                                                              |
| DELETE | `/marriage-confirmations/:id`         | Initiator cancel pending                                                                                  |

Member search for partner picker: GET `/v1/biodata/editor-grants/member-search?oppositeGenderOnly=true`.

## Notifications & activity

- Notifications: `MARRIAGE_CONFIRMATION_REQUEST`, `MARRIAGE_CONFIRMED`
- Activity (dual-party fanout): `MARRIAGE_CONFIRMATION_SENT`, `MARRIAGE_CONFIRMATION_RECEIVED`, `MARRIAGE_CONFIRMATION_DECIDED`, `MARRIAGE_CONFIRMED`

## Web BFF

- `apps/web/app/api/marriage-confirmations/` — proxy to API
- Client: `apps/web/lib/marriage-confirmation-api.ts`

## Shared types

- `@soulsync/shared-types/marriage-confirmation`
- `MemberBiodataViewDto.confirmedMarriages`, `BiodataMeDto.confirmedMarriages`
