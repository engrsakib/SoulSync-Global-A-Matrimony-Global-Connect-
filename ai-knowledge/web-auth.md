# Web login and registration

`/login` and `/register` both render `AuthPageShell` from `apps/web/components/auth/auth-page-shell.tsx`.

The public header is fixed at 64px. The shell clears that header and then keeps a gap:

- small screens: `pt-28` (112px) and `pb-12`
- `md` and up: `pt-32` (128px) and `pb-16`

Guest login is a tab inside the login page, so it uses the same shell. Do not add a second top offset on the form components themselves.
