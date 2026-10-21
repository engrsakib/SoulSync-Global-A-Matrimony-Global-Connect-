import { effectiveCheckInTimeZone } from './check-in-calendar';

/** Mirrors Prisma `CreditTransactionType`. */
export type CreditTransactionTypeDto =
  | 'PURCHASE'
  | 'PROPOSAL_SENT'
  | 'REFUND'
  | 'BONUS'
  | 'ADJUSTMENT';

export type CreditWalletSummaryDto = {
  balance: number;
  checkInTimeZone: string | null;
  currency: string | null;
};

export type CreditTransactionDto = {
  id: string;
  type: CreditTransactionTypeDto;
  amount: number;
  signedAmount: number;
  reference: string | null;
  description: string;
  createdAt: string;
};

export type CreditTransactionListDto = {
  items: CreditTransactionDto[];
  nextCursor: string | null;
  checkInTimeZone: string | null;
  balance: number;
};

const EARN_TYPES: ReadonlySet<CreditTransactionTypeDto> = new Set(['BONUS', 'REFUND']);
const DEDUCT_TYPES: ReadonlySet<CreditTransactionTypeDto> = new Set([
  'PURCHASE',
  'PROPOSAL_SENT',
]);

/**
 * Wallet balance changes: earn types use positive `amount`; deduct types use positive
 * stored `amount` and return negative signed delta. ADJUSTMENT may store signed amount.
 */
export function creditTransactionSignedAmount(
  type: CreditTransactionTypeDto,
  amount: number,
): number {
  const abs = Math.abs(amount);
  if (type === 'ADJUSTMENT') {
    return amount;
  }
  if (EARN_TYPES.has(type)) {
    return abs;
  }
  if (DEDUCT_TYPES.has(type)) {
    return -abs;
  }
  return amount;
}

export function creditTransactionDescription(
  type: CreditTransactionTypeDto,
  reference: string | null | undefined,
): string {
  const ref = reference?.trim();
  if (ref === 'daily-check-in') {
    return 'Daily check-in';
  }
  switch (type) {
    case 'BONUS':
      return ref ? `Bonus (${ref})` : 'Bonus';
    case 'REFUND':
      return ref ? `Refund (${ref})` : 'Refund';
    case 'PURCHASE':
      return ref ? `Purchase (${ref})` : 'Purchase';
    case 'PROPOSAL_SENT':
      return ref ? `Proposal (${ref})` : 'Proposal sent';
    case 'ADJUSTMENT':
      return ref ? `Adjustment (${ref})` : 'Adjustment';
    default:
      return ref ?? 'Transaction';
  }
}

export function formatCreditTransactionTime(
  iso: string,
  checkInTimeZone: string | null | undefined,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const timeZone = effectiveCheckInTimeZone(checkInTimeZone);
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }
}

export function formatSignedPoints(signedAmount: number): string {
  if (signedAmount > 0) {
    return `+${signedAmount}`;
  }
  return String(signedAmount);
}
