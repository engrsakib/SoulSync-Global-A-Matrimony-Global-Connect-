import type { AboutPageContentDto } from '@soulsync/shared-types/about-page';
import { loadAboutPageSeedFromDisk } from './seed';
import { readAboutPageFromRedis, writeAboutPageToRedis } from './redis';

export async function getAboutPageContent(): Promise<AboutPageContentDto> {
  const fromRedis = await readAboutPageFromRedis();
  if (fromRedis) {
    return fromRedis;
  }

  const fromSeed = loadAboutPageSeedFromDisk();
  await writeAboutPageToRedis(fromSeed);
  return fromSeed;
}

/** Future admin updates: persist to Redis (and later DB) then call this. */
export async function setAboutPageContent(content: AboutPageContentDto): Promise<void> {
  await writeAboutPageToRedis(content);
}
