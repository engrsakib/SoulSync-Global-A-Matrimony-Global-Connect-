# Password reset (email OTP)

Public flow for members who forgot their password. Same OTP mechanics as account email verification: **6-digit code**, **5 minute** Redis TTL, **3 sends / 15 min** rate limit per email (default tenant).

## API (no JWT)

Nest [`PasswordResetService`](../apps/api/src/auth/password-reset.service.ts):

| Method | Path | Body |
| ------ | ---- | ---- |
| POST | `/v1/auth/password-reset/request` | `{ email }` |
| POST | `/v1/auth/password-reset/verify-code` | `{ email, code }` |
| POST | `/v1/auth/password-reset/confirm` | `{ email, newPassword, confirmPassword }` |

Request always returns a neutral message (no account enumeration). Email is sent only when the default-tenant user exists, has a password credential, and is not a guest placeholder email.

After verify-code, Redis key `password-reset:{tenantId}:{email}` (15 min) must be set before confirm. OTP keys: `email-otp:password-reset:{tenantId}:{email}`.

## Web

- Page: `/forgot-password` — [`forgot-password-form.tsx`](../apps/web/components/auth/forgot-password-form.tsx)
- Login link: **Forgot password?** on [`login-form.tsx`](../apps/web/components/auth/login-form.tsx)
- BFF: `apps/web/app/api/auth/password-reset/*`
- Client: [`password-reset-api.ts`](../apps/web/lib/password-reset-api.ts)

Uses [`VerificationCodeInput`](../apps/web/components/auth/verification-code-input.tsx) and the same countdown/resend pattern as [`email-settings-dialog.tsx`](../apps/web/components/dashboard/email-settings-dialog.tsx).
