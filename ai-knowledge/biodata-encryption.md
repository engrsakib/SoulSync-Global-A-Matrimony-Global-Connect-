# Biodata field encryption

Matrimony biodata sensitive strings are encrypted at rest in PostgreSQL using **AES-256-GCM**. Only the Nest API holds the master key; the web app receives **decrypted** JSON for the authenticated owner via `GET /v1/biodata/me`.

## Environment

`apps/api/.env`:

```bash
BIODATA_MASTER_KEY=<32-byte key, base64url>
```

Generate:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Rotation requires re-running the backfill script with the new key after decrypting with the old key (document a maintenance window before rotating).

## Storage format

Ciphertext prefix: `enc:v1:` followed by `iv.tag.ciphertext` (base64url segments), same layout as login-code encryption.

Legacy plaintext rows are still readable until backfill; new writes always encrypt.

## Encrypted columns

| Model               | Fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Profile`           | displayName, city, country, stateRegion, postalCode, locationDetails, motherTongue, education, degreeName, degreeMajor, institution, occupation, employer, workLocation, bio, denomination, community, religiousPractice, chronicConditionsDetail, fatherProfession, motherProfession, unclesOccupations, residenceDescription, familyRelatives (JSON wrapper `{ relatives: [...] }` via encryptJson), missedFardPrayersNotes, aqeedahNotes, beardDetails, usualOutdoorClothing, favoriteIslamicBooks, favoriteScholars, entertainmentHabits, dawahInvolvement, quranHifzNotes |
| `MyPreference`      | district, country, denomination, community, motherTongue, customExpectations (JSON wrapper `{ "_encrypted": "..." }`)                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `PartnerPreference` | preferredDistricts, preferredCountries, preferredDenominations, preferredCommunities, preferredMotherTongues, customExpectations                                                                                                                                                                                                                                                                                                                                                                                                                                               |

Enums, numeric filters, booleans, and dates stay plaintext for matching indexes.

## API

| Method | Path                                 |
| ------ | ------------------------------------ |
| GET    | `/v1/biodata/me`                     |
| PATCH  | `/v1/biodata/me/sections/:sectionId` |

Web BFF: `/api/biodata/me`, `/api/biodata/me/sections/[sectionId]`.

## Backfill

```bash
pnpm exec tsx apps/api/scripts/backfill-biodata-encryption.ts
```

## Access (phase 1)

JWT required; `userId` from token must own the profile. Consent-based decrypt for matches is planned (proposals / consent logs).
