/**
 * One-off: encrypt legacy plaintext biodata fields at rest.
 * Usage (from repo root): pnpm exec tsx apps/api/scripts/backfill-biodata-encryption.ts
 */
import type { ConfigService } from '@nestjs/config';
import type { Prisma } from '@soulsync/db';
import { createPrismaClient } from '@soulsync/db';
import {
  decryptMyPreferenceToDto,
  decryptPartnerPreferenceToDto,
  decryptProfileToDto,
  encryptMyPreferenceForStorage,
  encryptPartnerPreferenceForStorage,
  encryptProfileForStorage,
} from '../src/biodata/biodata.mapper';
import type { Env } from '../src/config/env.schema';
import { validateEnv } from '../src/config/env.schema';
import { loadApiEnvFile } from '../src/config/load-api-env';
import { FieldEncryptionService } from '../src/crypto/field-encryption.service';

async function main(): Promise<void> {
  loadApiEnvFile();
  const env = validateEnv(process.env);
  const config = {
    get: (key: keyof Env) => env[key],
  } as ConfigService<Env, true>;
  const crypto = new FieldEncryptionService(config);
  crypto.onModuleInit();

  const prisma = createPrismaClient(env.DATABASE_URL);
  await prisma.$connect();

  const profiles = await prisma.profile.findMany();
  for (const profile of profiles) {
    const plain = decryptProfileToDto(crypto, profile);
    await prisma.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(crypto, {
        displayName: plain.displayName,
        city: plain.city,
        country: plain.country,
        motherTongue: plain.motherTongue,
        education: plain.education,
        occupation: plain.occupation,
        bio: plain.bio,
        denomination: plain.denomination,
        community: plain.community,
        religiousPractice: plain.religiousPractice,
      }),
    });
  }

  const myPrefs = await prisma.myPreference.findMany();
  for (const row of myPrefs) {
    const plain = decryptMyPreferenceToDto(crypto, row);
    await prisma.myPreference.update({
      where: { id: row.id },
      data: encryptMyPreferenceForStorage(crypto, {
        district: plain.district,
        country: plain.country,
        denomination: plain.denomination,
        community: plain.community,
        motherTongue: plain.motherTongue,
        customExpectations: plain.customExpectations,
      }) as Prisma.MyPreferenceUpdateInput,
    });
  }

  const partnerPrefs = await prisma.partnerPreference.findMany();
  for (const row of partnerPrefs) {
    const plain = decryptPartnerPreferenceToDto(crypto, row);
    await prisma.partnerPreference.update({
      where: { id: row.id },
      data: encryptPartnerPreferenceForStorage(crypto, {
        preferredDistricts: plain.preferredDistricts,
        preferredCountries: plain.preferredCountries,
        preferredDenominations: plain.preferredDenominations,
        preferredCommunities: plain.preferredCommunities,
        preferredMotherTongues: plain.preferredMotherTongues,
        customExpectations: plain.customExpectations,
      }) as Prisma.PartnerPreferenceUpdateInput,
    });
  }

  console.log(
    `Backfill complete: ${profiles.length} profiles, ${myPrefs.length} my preferences, ${partnerPrefs.length} partner preferences.`,
  );

  await prisma.$disconnect();
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
