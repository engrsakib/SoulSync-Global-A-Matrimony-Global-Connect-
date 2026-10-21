import type { BiodataProfileDto } from '@soulsync/shared-types/biodata';

export function initialDegreeName(profile: BiodataProfileDto): string {
  if (profile.degreeName?.trim()) {
    return profile.degreeName.trim();
  }
  return profile.education?.trim() ?? '';
}

export function hasStructuredEducation(profile: BiodataProfileDto): boolean {
  return Boolean(
    profile.degreeName?.trim() ||
    profile.degreeMajor?.trim() ||
    profile.institution?.trim() ||
    profile.graduationYear,
  );
}
