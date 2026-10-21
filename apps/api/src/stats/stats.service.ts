import { Injectable } from '@nestjs/common';
import { Gender } from '@soulsync/db';
import type { PlatformBiodataStatsDto } from '@soulsync/shared-types/platform-stats';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBiodataOverview(): Promise<PlatformBiodataStatsDto> {
    const groups = await this.prisma.client.profile.groupBy({
      by: ['religion', 'gender'],
      where: {
        isDiscoverable: true,
        isVisibilityPrivate: false,
        tenant: { isActive: true },
        user: { deletedAt: null },
      },
      _count: { _all: true },
    });

    let total = 0;
    let male = 0;
    let female = 0;
    const byReligionMap = new Map<string, { male: number; female: number }>();

    for (const row of groups) {
      const count = row._count._all;
      total += count;

      if (row.gender === Gender.MALE) {
        male += count;
      } else if (row.gender === Gender.FEMALE) {
        female += count;
      }

      const religionKey = row.religion;
      const entry = byReligionMap.get(religionKey) ?? { male: 0, female: 0 };
      if (row.gender === Gender.MALE) {
        entry.male += count;
      } else if (row.gender === Gender.FEMALE) {
        entry.female += count;
      }
      byReligionMap.set(religionKey, entry);
    }

    const byReligion = [...byReligionMap.entries()]
      .filter(([, counts]) => counts.male + counts.female > 0)
      .map(([religion, counts]) => ({
        religion,
        male: counts.male,
        female: counts.female,
      }));

    return { total, male, female, byReligion };
  }
}
