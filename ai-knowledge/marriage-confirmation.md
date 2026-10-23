# Confirm marriage (mutual history + public badge)

Separate from guardian **marriage pledges** (`guardian_contact` biodata section). This flow links two tenant members by username with partner acceptance.

## Rules

- Dashboard **Confirm marriage** card is the **last** block on own biodata in [`biodata-builder.tsx`](../apps/web/components/dashboard/biodata-builder.tsx) (after all sections and gallery; not a `BIODATA_SECTION_IDS` section; not gated by section privacy). Lists (pending/confirmed/history) appear above the send-request form; marriage date uses `@soulsync/ui/iso-date-picker` (same calendar UX as date of birth).
- Initiator must be **opposite gender** to partner (`Profile.gender`: MALE ↔ FEMALE).
- Each row has a required **marriage date** (`YYYY-MM-DD`, stored as `@db.Date`).
- Partner **accept** / **decline**; initiator can **cancel** while `PENDING`. **Cancel** and **decline** remove the row from the database (never confirmed).
- **History** lists only **DIVORCED** and **DECEASED** (confirmed marriages that ended). **CONFIRMED** rows are permanent until divorced/deceased.
- Public member biodata shows all **CONFIRMED** entries (partner name, date, link).
- **`Profile.hasConfirmedMarriage`**: set `true` for both users on accept; inactivity auto-private skips these profiles ([`check-in-inactivity.md`](check-in-inactivity.md)).

## Data model

- `MarriageConfirmation` — statuses `PENDING`, `CONFIRMED`, `DECLINED`, `CANCELLED`
- Unique `(initiatorUserId, partnerUserId, marriageDate)`

## API (JWT, prefix `/v1`)

Module [`apps/api/src/marriage-confirmation/`](../apps/api/src/marriage-confirmation/) imports `AuthModule` (controller uses `JwtAuthGuard` → `JwtTokenService`).

| Method | Path                                  | Behavior                                      |
| ------ | ------------------------------------- | --------------------------------------------- |
| GET    | `/marriage-confirmations/me`          | Pending incoming/outgoing, confirmed, history |
| POST   | `/marriage-confirmations`             | Body `{ partnerUsername, marriageDate }`      |
| POST   | `/marriage-confirmations/:id/accept`  | Partner only                                  |
| POST   | `/marriage-confirmations/:id/decline` | Partner only                                  |
| DELETE | `/marriage-confirmations/:id`         | Initiator cancel pending                      |

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
