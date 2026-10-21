import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreditTransactionType } from '@soulsync/db';
import type {
  CreditTransactionDto,
  CreditTransactionListDto,
  CreditTransactionTypeDto,
  CreditWalletSummaryDto,
} from '@soulsync/shared-types/credits';
import {
  creditTransactionDescription,
  creditTransactionSignedAmount,
} from '@soulsync/shared-types/credits';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<CreditWalletSummaryDto> {
    const bundle = await this.loadUserWalletBundle(userId);
    return this.toSummaryDto(bundle);
  }

  async listTransactions(
    userId: string,
    options: { limit?: number; cursor?: string } = {},
  ): Promise<CreditTransactionListDto> {
    const bundle = await this.loadUserWalletBundle(userId);
    const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const cursor = parseTransactionCursor(options.cursor);

    if (!bundle.wallet) {
      return {
        items: [],
        nextCursor: null,
        checkInTimeZone: bundle.checkInTimeZone,
        balance: 0,
      };
    }

    const rows = await this.prisma.client.creditTransaction.findMany({
      where: {
        walletId: bundle.wallet.id,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                {
                  createdAt: cursor.createdAt,
                  id: { lt: cursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((row) => this.toTransactionDto(row)),
      nextCursor: hasMore && last ? encodeTransactionCursor(last.createdAt, last.id) : null,
      checkInTimeZone: bundle.checkInTimeZone,
      balance: bundle.wallet.balance,
    };
  }

  private async loadUserWalletBundle(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        profile: { select: { checkInTimeZone: true } },
        creditWallet: { select: { id: true, balance: true, currency: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      checkInTimeZone: user.profile?.checkInTimeZone ?? null,
      wallet: user.creditWallet,
    };
  }

  private toSummaryDto(bundle: {
    checkInTimeZone: string | null;
    wallet: { balance: number; currency: string } | null;
  }): CreditWalletSummaryDto {
    return {
      balance: bundle.wallet?.balance ?? 0,
      checkInTimeZone: bundle.checkInTimeZone,
      currency: bundle.wallet?.currency ?? null,
    };
  }

  private toTransactionDto(row: {
    id: string;
    type: CreditTransactionType;
    amount: number;
    reference: string | null;
    createdAt: Date;
  }): CreditTransactionDto {
    const type: CreditTransactionTypeDto = row.type;
    const signedAmount = creditTransactionSignedAmount(type, row.amount);
    return {
      id: row.id,
      type,
      amount: row.amount,
      signedAmount,
      reference: row.reference,
      description: creditTransactionDescription(type, row.reference),
      createdAt: row.createdAt.toISOString(),
    };
  }
}

function encodeTransactionCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, 'utf8').toString('base64url');
}

function parseTransactionCursor(
  raw: string | undefined,
): { createdAt: Date; id: string } | null {
  if (!raw?.trim()) {
    return null;
  }
  try {
    const decoded = Buffer.from(raw.trim(), 'base64url').toString('utf8');
    const sep = decoded.indexOf('|');
    if (sep < 0) {
      return null;
    }
    const createdAt = new Date(decoded.slice(0, sep));
    const id = decoded.slice(sep + 1);
    if (Number.isNaN(createdAt.getTime()) || !id) {
      return null;
    }
    return { createdAt, id };
  } catch {
    return null;
  }
}
