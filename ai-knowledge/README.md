# AI knowledge

Living notes for this repo. Read these before changing auth, lint, or app structure. Update them at the end of a task when the change affects behavior, layout, commands, or conventions.

| File                                             | What it covers                                   |
| ------------------------------------------------ | ------------------------------------------------ |
| [architecture.md](./architecture.md)             | Apps, packages, ports, and how requests move     |
| [quality.md](./quality.md)                       | Lint, types, formatting, and the pre-commit hook |
| [web-auth.md](./web-auth.md)                     | Public login and registration layout             |
| [api-responses.md](./api-responses.md)           | Nest API envelope and client unwrapping          |
| [email-verification.md](./email-verification.md) | SMTP email set/change and OTP flows              |
| [swagger.md](./swagger.md)                       | OpenAPI docs, envelope helpers, DTO plugin       |
| [dashboard-ui.md](./dashboard-ui.md)             | Dashboard shell, profile routes, green UI        |
| [log.md](./log.md)                               | Short record of meaningful changes               |

## Update rule

When a task changes behavior, routes, layout, data, tooling, or commands:

1. Edit the matching note in this folder. Add a file if none of the existing notes fit.
2. Add one dated line to [log.md](./log.md).
3. Leave the notes accurate. Do not paste secrets, `.env` values, or generated build output.
