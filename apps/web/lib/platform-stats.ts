export type ReligionBiodataBreakdown = {
  religion: string;
  male: number;
  female: number;
};

export type PlatformBiodataStats = {
  total: number;
  male: number;
  female: number;
  byReligion: ReligionBiodataBreakdown[];
};

/** Placeholder totals until GET /v1/stats/biodata exists; byReligion rows sum to total. */
const STATIC_PLATFORM_BIODATA_STATS: PlatformBiodataStats = {
  total: 1248,
  male: 642,
  female: 606,
  byReligion: [
    { religion: 'ISLAM', male: 280, female: 260 },
    { religion: 'HINDUISM', male: 160, female: 155 },
    { religion: 'CHRISTIANITY', male: 125, female: 118 },
    { religion: 'SIKHISM', male: 42, female: 38 },
    { religion: 'BUDDHISM', male: 35, female: 35 },
  ],
};

export function getPlatformBiodataStats(): Promise<PlatformBiodataStats> {
  return Promise.resolve(STATIC_PLATFORM_BIODATA_STATS);
}
