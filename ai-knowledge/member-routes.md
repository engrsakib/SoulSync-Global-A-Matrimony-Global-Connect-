# Member routes (public site shell)

Some signed-in experiences use the **public layout** ([`(public)/layout.tsx`](<../apps/web/app/(public)/layout.tsx>): `SiteHeader` + `SiteFooter`), not the dashboard sidebar.

Path constants: [`apps/web/lib/member-routes.ts`](../apps/web/lib/member-routes.ts).

| Path                                     | Auth                                                       | Layout                                                                      |
| ---------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `/communities`                           | Required (middleware + page redirect to login with `next`) | Public shell; group directory (search, create, join)                        |
| `/communities/[slug]`                    | Required                                                   | Public shell; group feed, composer, reactions, comments                     |
| `/communities/[slug]/members`            | Required                                                   | Member directory (join required to list); admin row actions for OWNER/ADMIN |
| `/communities/[slug]/settings`           | Required                                                   | Community settings (OWNER/ADMIN); join-request queue (moderators+)          |
| `/communities/[slug]/members/[username]` | Required                                                   | Public shell; `@username` post history in group                             |

| `/share/post/[shareToken]` | None | Public shared community post preview |

Homepage marketing block `#communities` (active tenants list) remains on `/`.

Member **groups** API and BFF: see [`communities-groups.md`](./communities-groups.md).
