import { isAboutPageContentDto, type AboutPageContentDto } from '@soulsync/shared-types/about-page';
import aboutPageSeedJson from '../../data/about-page.seed.json';

let cachedSeed: AboutPageContentDto | null = null;

export function loadAboutPageSeedFromDisk(): AboutPageContentDto {
  if (cachedSeed) {
    return cachedSeed;
  }
  const parsed: unknown = aboutPageSeedJson;
  if (!isAboutPageContentDto(parsed)) {
    throw new Error('Invalid about-page.seed.json shape');
  }
  cachedSeed = parsed;
  return parsed;
}
