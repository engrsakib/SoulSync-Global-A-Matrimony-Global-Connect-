import type { AboutPageMilestoneItemDto } from '@soulsync/shared-types/about-page';

/** Newest `period` (year) first; stable seed order within the same year. */
export function sortMilestonesNewestFirst(
  items: readonly AboutPageMilestoneItemDto[],
): AboutPageMilestoneItemDto[] {
  return items
    .map((item, seedIndex) => ({ item, seedIndex }))
    .sort((a, b) => {
      const yearA = Number.parseInt(a.item.period, 10) || 0;
      const yearB = Number.parseInt(b.item.period, 10) || 0;
      if (yearB !== yearA) {
        return yearB - yearA;
      }
      return a.seedIndex - b.seedIndex;
    })
    .map(({ item }) => item);
}
