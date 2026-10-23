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

/** User-facing message when `(initiator, partner, marriageDate)` already exists. */
export function duplicateMarriageConfirmationMessage(
  status: MarriageConfirmationStatus,
): string {
  switch (status) {
    case MarriageConfirmationStatus.PENDING:
      return 'You already sent a marriage confirmation to this member for that date.';
    case MarriageConfirmationStatus.CONFIRMED:
      return 'You already have a confirmed marriage with this member on that date.';
    case MarriageConfirmationStatus.DIVORCED:
    case MarriageConfirmationStatus.DECEASED:
      return 'A marriage with this member on that date is already on record as ended. Choose a different date or update your marriage registry.';
    default:
      return 'A marriage confirmation already exists for this member and date.';
  }
}

export function canViewPendingMarriageReview(
  row: {
    status: MarriageConfirmationStatus;
    initiatorUserId: string;
    partnerUserId: string | null;
  },
  viewerUserId: string,
): boolean {
  if (row.status !== MarriageConfirmationStatus.PENDING) {
    return false;
  }
  if (row.initiatorUserId === viewerUserId) {
    return true;
  }
  return row.partnerUserId === viewerUserId;
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

export async function countRegistryConfirmedMarriagesForUser(
  prisma: PrismaClient,
  userId: string,
): Promise<number> {
  return prisma.marriageRecord.count({
    where: { userId, status: MarriageRecordStatus.CONFIRMED },
  });
}

/** True when this pending SoulSync row already has a locked CONFIRMED registry slot (accept does not add a wife). */
export async function hasConfirmedRegistrySlotForConfirmation(
  prisma: PrismaClient,
  userId: string,
  marriageConfirmationId: string,
): Promise<boolean> {
  const row = await prisma.marriageRecord.findFirst({
    where: {
      userId,
      marriageConfirmationId,
      status: MarriageRecordStatus.CONFIRMED,
    },
    select: { id: true },
  });
  return row != null;
}

/** Enforces slot cap: male = registry CONFIRMED only; female = registry + unlinked SoulSync CONFIRMED. */
export async function countActiveConfirmedMarriagesForCapacity(
  prisma: PrismaClient,
  userId: string,
  gender: Gender,
): Promise<number> {
  if (gender === 'MALE') {
    return countRegistryConfirmedMarriagesForUser(prisma, userId);
  }
  return countActiveConfirmedMarriages(prisma, userId);
}
