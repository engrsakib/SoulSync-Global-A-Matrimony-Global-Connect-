# Profile compatibility matching

Pairwise **viewer-centric** match percentage (0–100) for opposite-gender members. Pure scoring lives in `@soulsync/shared-types/compatibility`; Nest [`CompatibilityService`](../apps/api/src/compatibility/compatibility.service.ts) loads decrypted snapshots, applies eligibility, caches in Redis.

## Weights (100% total)

| Category                                 | Weight |
| ---------------------------------------- | ------ |
| Education & career                       | 25%    |
| Lifestyle, religious & family values     | 25%    |
| Location                                 | 20%    |
| Interests (Jaccard on bio / habits text) | 15%    |
| Age & height vs partner preference       | 15%    |

`scoringMode`: `viewer_to_target` — target attributes vs viewer’s `PartnerPreference`.

## Eligibility (hard filters)

Returns HTTP 200 with `eligible: false` and `ineligibleReason` (not an error) when:

- Same gender or not opposite-gender preferences
- Missing/inactive `PartnerPreference` or `MyPreference`
- Target not discoverable (unless accepted proposal)
- Religion audience mismatch (unless accepted proposal)
- Target below viewer’s `minProfileCompleteness`

Opposite gender and tenant membership are required.

## API

- `GET /v1/profiles/:userId/compatibility` — JWT; viewer from token
- `GET /v1/biodata/members/:username/compatibility` — same, username in tenant

Response type: `ProfileCompatibilityDto` (`overallPercent`, `breakdown`, `weights`, `computedAt`).

## BFF (web)

- `/api/profiles/[userId]/compatibility`
- `/api/biodata/members/[username]/compatibility`

Client: [`compatibility-api.ts`](../apps/web/lib/compatibility-api.ts). UI: biodata link preview card + member biodata header badge.

## Cache

Redis key `compat:v1:{tenantId}:{sortedUserIds}:{matchingVersions}`; TTL 30 minutes. Versions = max `updatedAt` on profile + preferences per user. Degrades if Redis unavailable.

## Data loading

[`CompatibilitySnapshotLoader`](../apps/api/src/compatibility/compatibility-snapshot.loader.ts) — one query per user; decrypt via biodata mappers (no full `getMine`).
