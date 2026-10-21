# Member routes (public site shell)

Some signed-in experiences use the **public layout** ([`(public)/layout.tsx`](../apps/web/app/(public)/layout.tsx): `SiteHeader` + `SiteFooter`), not the dashboard sidebar.

Path constants: [`apps/web/lib/member-routes.ts`](../apps/web/lib/member-routes.ts).

| Path | Auth | Layout |
| ---- | ---- | ------ |
| `/communities` | Required (middleware + page redirect to login with `next`) | Public shell; placeholder for discovery UI |

Homepage marketing block `#communities` (active tenants list) remains on `/`.
