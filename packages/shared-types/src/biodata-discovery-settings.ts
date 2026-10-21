import type { PhotoVisibility } from './biodata';
import { PHOTO_VISIBILITY_VALUES } from './biodata';
import type { Religion } from './partner-preference';
import { RELIGION_VALUES } from './partner-preference';
import { RELIGION_LABELS } from './religion-branches';

export const BIODATA_LISTING_VISIBILITY = ['PRIVATE', 'PUBLIC'] as const;
export type BiodataListingVisibility = (typeof BIODATA_LISTING_VISIBILITY)[number];

export const DISCOVERY_RELIGION_MODES = [
  'SAME_AS_MINE',
  'ALL_RELIGIONS',
  'SELECTED_RELIGIONS',
] as const;
export type DiscoveryReligionMode = (typeof DISCOVERY_RELIGION_MODES)[number];

export const PHOTO_VISIBILITY_LABELS: Record<PhotoVisibility, string> = {
  PUBLIC: 'Everyone (including visitors)',
  MEMBERS_ONLY: 'Members only',
  ON_CONSENT: 'After I approve a request',
  HIDDEN: 'Hidden',
};

export const DISCOVERY_RELIGION_MODE_LABELS: Record<DiscoveryReligionMode, string> = {
  SAME_AS_MINE: 'My religion only',
  ALL_RELIGIONS: 'All religions',
  SELECTED_RELIGIONS: 'Selected religions',
};

/** Religions selectable when audience is "Selected religions". */
export const DISCOVERY_RELIGION_PICKER_VALUES = RELIGION_VALUES.filter(
  (r): r is Religion => r !== 'PREFER_NOT_TO_SAY',
);

export function listingVisibilityFromDiscoverable(isDiscoverable: boolean): BiodataListingVisibility {
  return isDiscoverable ? 'PUBLIC' : 'PRIVATE';
}

export function discoverableFromListingVisibility(
  visibility: BiodataListingVisibility,
): boolean {
  return visibility === 'PUBLIC';
}

export function listingVisibilityLabel(isDiscoverable: boolean): string {
  return listingVisibilityFromDiscoverable(isDiscoverable) === 'PUBLIC' ? 'Public' : 'Private';
}

export function formatDiscoveryReligionAudience(
  mode: DiscoveryReligionMode,
  ownerReligion: Religion,
  allowList: Religion[],
): string {
  switch (mode) {
    case 'SAME_AS_MINE':
      return RELIGION_LABELS[ownerReligion] ?? ownerReligion;
    case 'ALL_RELIGIONS':
      return 'All religions';
    case 'SELECTED_RELIGIONS':
      if (allowList.length === 0) {
        return 'No religions selected';
      }
      return allowList.map((r) => RELIGION_LABELS[r] ?? r).join(', ');
    default:
      return mode;
  }
}

export function validateDiscoveryReligionSettings(input: {
  discoveryReligionMode?: DiscoveryReligionMode;
  discoveryReligionAllowList?: Religion[];
}): string | null {
  if (
    input.discoveryReligionMode !== undefined &&
    !(DISCOVERY_RELIGION_MODES as readonly string[]).includes(input.discoveryReligionMode)
  ) {
    return 'Invalid discovery religion mode';
  }
  if (input.discoveryReligionAllowList !== undefined) {
    for (const religion of input.discoveryReligionAllowList) {
      if (!(RELIGION_VALUES as readonly string[]).includes(religion)) {
        return 'Invalid religion in allow list';
      }
      if (religion === 'PREFER_NOT_TO_SAY') {
        return 'Prefer not to say cannot be used as an audience filter';
      }
    }
  }
  const mode = input.discoveryReligionMode;
  const list = input.discoveryReligionAllowList;
  if (mode === 'SELECTED_RELIGIONS' && list !== undefined && list.length === 0) {
    return 'Select at least one religion';
  }
  return null;
}

export function isPhotoVisibility(value: string): value is PhotoVisibility {
  return (PHOTO_VISIBILITY_VALUES as readonly string[]).includes(value);
}
