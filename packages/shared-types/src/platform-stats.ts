export type ReligionBiodataBreakdownDto = {
  religion: string;
  male: number;
  female: number;
};

export type PlatformBiodataStatsDto = {
  total: number;
  male: number;
  female: number;
  byReligion: ReligionBiodataBreakdownDto[];
};

export const EMPTY_PLATFORM_BIODATA_STATS: PlatformBiodataStatsDto = {
  total: 0,
  male: 0,
  female: 0,
  byReligion: [],
};
