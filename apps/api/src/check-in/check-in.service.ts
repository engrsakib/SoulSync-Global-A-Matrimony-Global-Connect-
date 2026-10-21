import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreditTransactionType } from '@soulsync/db';
import type { CheckInResultDto, CheckInStatusDto } from '@soulsync/shared-types/check-in';
import {
  calendarDateKey,
  effectiveCheckInTimeZone,
  hasCheckedInToday,
} from '@soulsync/shared-types/check-in';
import type { Env } from '../config/env.schema';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async getStatus(userId: string): Promise<CheckInStatusDto> {
    const bundle = await this.loadUserBundle(userId);
    return this.toStatusDto(bundle);
  }

  async checkIn(userId: string): Promise<CheckInResultDto> {
    const pointsPerCheckIn = this.config.get('DAILY_CHECKIN_POINTS', { infer: true });

    return this.prisma.client.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          tenantId: true,
          lastCheckInAt: true,
          profile: { select: { checkInTimeZone: true } },
          creditWallet: { select: { id: true, balance: true } },
        },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const timeZone = effectiveCheckInTimeZone(user.profile?.checkInTimeZone);
      const now = new Date();

      if (hasCheckedInToday(user.lastCheckInAt, user.profile?.checkInTimeZone, now)) {
        const balance = user.creditWallet?.balance ?? null;
        return {
          checkedInToday: true,
          lastCheckInAt: user.lastCheckInAt?.toISOString() ?? null,
          checkInTimeZone: user.profile?.checkInTimeZone ?? null,
          pointsPerCheckIn,
          walletBalance: balance,
          pointsAwarded: 0,
          alreadyCheckedIn: true,
        };
      }

      await tx.user.update({
        where: { id: userId },
        data: { lastCheckInAt: now },
      });

      const wallet = await tx.creditWallet.upsert({
        where: { userId },
        create: {
          userId,
          tenantId: user.tenantId,
          balance: pointsPerCheckIn,
        },
        update: {
          balance: { increment: pointsPerCheckIn },
        },
      });

      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          amount: pointsPerCheckIn,
          type: CreditTransactionType.BONUS,
          reference: 'daily-check-in',
          metadata: {
            dateKey: calendarDateKey(now, timeZone),
            points: pointsPerCheckIn,
          },
        },
      });

      return {
        checkedInToday: true,
        lastCheckInAt: now.toISOString(),
        checkInTimeZone: user.profile?.checkInTimeZone ?? null,
        pointsPerCheckIn,
        walletBalance: wallet.balance,
        pointsAwarded: pointsPerCheckIn,
        alreadyCheckedIn: false,
      };
    });
  }

  private async loadUserBundle(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        lastCheckInAt: true,
        profile: { select: { checkInTimeZone: true } },
        creditWallet: { select: { balance: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private toStatusDto(user: {
    lastCheckInAt: Date | null;
    profile: { checkInTimeZone: string | null } | null;
    creditWallet: { balance: number } | null;
  }): CheckInStatusDto {
    const pointsPerCheckIn = this.config.get('DAILY_CHECKIN_POINTS', { infer: true });
    const tz = user.profile?.checkInTimeZone ?? null;
    return {
      checkedInToday: hasCheckedInToday(user.lastCheckInAt, tz),
      lastCheckInAt: user.lastCheckInAt?.toISOString() ?? null,
      checkInTimeZone: tz,
      pointsPerCheckIn,
      walletBalance: user.creditWallet?.balance ?? null,
    };
  }
}
