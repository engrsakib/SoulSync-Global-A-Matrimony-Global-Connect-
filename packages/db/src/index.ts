import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export * from './generated/prisma/client';

/** Reject password if it matches current or any of this many prior hashes. */
export const PASSWORD_HISTORY_DEPTH = 3;

/** Partner preference age bounds (enforced in API; not DB constraints). */
export const PARTNER_PREFERENCE_MIN_AGE = 16;
export const PARTNER_PREFERENCE_MAX_AGE = 60;

export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
