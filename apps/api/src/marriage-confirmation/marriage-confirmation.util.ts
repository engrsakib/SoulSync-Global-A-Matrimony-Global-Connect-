import {
  type Gender,
  MarriageConfirmationStatus,
  MarriageRecordStatus,
  type PrismaClient,
} from '@soulsync/db';

const ISO_DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isOppositeGenderPair(initiator: Gender, partner: Gender): boolean {
  if (initiator === 'MALE') {
    return partner === 'FEMALE';
  }
  if (initiator === 'FEMALE') {
    return partner === 'MALE';
  }
  return false;
}

/** Parse YYYY-MM-DD to UTC midnight Date for @db.Date storage. */
export function parseMarriageDateInput(raw: string): Date {
  const trimmed = raw.trim();
  if (!ISO_DATE_ONLY_RE.test(trimmed)) {
    throw new Error('INVALID_DATE');
  }
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('INVALID_DATE');
  }
  const roundTrip = date.toISOString().slice(0, 10);
  if (roundTrip !== trimmed) {
    throw new Error('INVALID_DATE');
  }
  return date;
}

export function formatMarriageDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Registry + mutual confirmations, without double-counting linked rows. */
export async function countActiveConfirmedMarriages(
  prisma: PrismaClient,
  userId: string,
): Promise<number> {
  const linkedRows = await prisma.marriageRecord.findMany({
    where: { userId, marriageConfirmationId: { not: null } },
    select: { marriageConfirmationId: true },
  });
  const linkedConfirmationIds = linkedRows
    .map((row) => row.marriageConfirmationId)
    .filter((id): id is string => id != null);

  const [registryActive, standaloneConfirmations] = await Promise.all([
    prisma.marriageRecord.count({
      where: { userId, status: MarriageRecordStatus.CONFIRMED },
    }),
    prisma.marriageConfirmation.count({
      where: {
        status: MarriageConfirmationStatus.CONFIRMED,
        OR: [{ initiatorUserId: userId }, { partnerUserId: userId }],
        ...(linkedConfirmationIds.length > 0 ? { id: { notIn: linkedConfirmationIds } } : {}),
      },
    }),
  ]);

  return registryActive + standaloneConfirmations;
}
