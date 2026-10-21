# Homepage platform biodata stats

Public aggregate counts for the landing page **Platform insights** section (`/#stats`).

## API

Nest module [`apps/api/src/stats/`](../apps/api/src/stats/):

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/v1/stats/biodata` | None |

Response: [`PlatformBiodataStatsDto`](../packages/shared-types/src/platform-stats.ts) — `total`, `male`, `female`, `byReligion[]` with `{ religion, male, female }`.

### Inclusion rules

Counts `Profile` rows where:

- `isDiscoverable === true` and `isVisibilityPrivate === false`
- `tenant.isActive === true`
- `user.deletedAt === null`

Implementation: Prisma `profile.groupBy({ by: ['religion', 'gender'], ... })` across all active tenants.

## Web

- SSR: [`getPlatformBiodataStats()`](../apps/web/lib/platform-stats.ts) → `GET ${NEXT_PUBLIC_API_URL}/stats/biodata` with `revalidate: 60` (same pattern as tenants). On failure, returns zeros.
- UI: [`biodata-stats-section.tsx`](../apps/web/components/biodata-stats-section.tsx) on [`apps/web/app/(public)/page.tsx`](../apps/web/app/(public)/page.tsx).
