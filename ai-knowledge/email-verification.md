# Email verification (set / change)

Users set or change contact email through 6-digit codes sent over SMTP. Codes expire in **5 minutes** and are stored hashed in Redis.

## Guest accounts

- Internal placeholder addresses (`*@guest.soulsync.local`) are **not** shown in the dashboard.
- After verification, the real address **replaces** the placeholder in `users.email` and `isGuest` is set to **false** (full member for UI and `guestLogin` eligibility).

## API (`apps/api`)

Authenticated routes under `/v1/auth/me/email/`:

| Action                   | Path                                      |
| ------------------------ | ----------------------------------------- |
| Set — request code       | `POST …/set/request` `{ email }`          |
| Set — confirm            | `POST …/set/confirm` `{ email, code }`    |
| Change — code to current | `POST …/change/request-current`           |
| Change — verify current  | `POST …/change/verify-current` `{ code }` |
| Change — code to new     | `POST …/change/request-new` `{ email }`   |
| Change — confirm new     | `POST …/change/confirm` `{ email, code }` |

Web BFF mirrors these under `/api/account/email/…`.

## Environment (`apps/api/.env`, see `.env.example`)

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_PUBLIC_NAME`
- Never commit real passwords; rotate if exposed.

## Redis keys

- `email-otp:{purpose}:{userId}` or with `:emailNorm`
- `email-change:{userId}:current` — after current email verified (15 min)
- `email-otp:send-count:{userId}` — rate limit (3 sends / 15 min)

## Public user fields

- `email: string | null` — null for guest placeholders
- `hasVerifiedEmail: boolean` — `emailVerifiedAt` set and not a placeholder

Helpers: `isGuestPlaceholderEmail`, `normalizeEmail` in `@soulsync/shared-types`.
