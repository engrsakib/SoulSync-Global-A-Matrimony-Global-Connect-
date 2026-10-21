import { unwrapApiPayload } from '@soulsync/shared-types';
import {
  EMPTY_PLATFORM_BIODATA_STATS,
  type PlatformBiodataStatsDto,
  type ReligionBiodataBreakdownDto,
} from '@soulsync/shared-types/platform-stats';

export type ReligionBiodataBreakdown = ReligionBiodataBreakdownDto;
export type PlatformBiodataStats = PlatformBiodataStatsDto;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export async function getPlatformBiodataStats(): Promise<PlatformBiodataStats> {
  try {
    const response = await fetch(`${apiBaseUrl}/stats/biodata`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { ...EMPTY_PLATFORM_BIODATA_STATS };
    }

    const raw: unknown = await response.json();
    return unwrapApiPayload<PlatformBiodataStats>(raw);
  } catch {
    return { ...EMPTY_PLATFORM_BIODATA_STATS };
  }
}
