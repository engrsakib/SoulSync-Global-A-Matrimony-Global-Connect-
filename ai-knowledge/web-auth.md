# Web login and registration

`/login`, `/register`, and `/forgot-password` render `AuthPageShell` from `apps/web/components/auth/auth-page-shell.tsx`. If the user already has a session cookie, those pages redirect to `/dashboard/profile` via `redirectIfLoggedIn()` in `apps/web/lib/auth-server.ts`.

**Forgot password:** email → 6-digit SMTP code (5 min) → new password. See [password-reset.md](./password-reset.md). Entry: **Forgot password?** on the login form.

The public header is fixed at 64px. The shell clears that header and then keeps a gap:

- small screens: `pt-28` (112px) and `pb-12`
- `md` and up: `pt-32` (128px) and `pb-16`

Guest login is a tab inside the login page, so it uses the same shell. Do not add a second top offset on the form components themselves.
