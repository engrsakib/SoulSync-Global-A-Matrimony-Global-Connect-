import type { BiodataAccessRequestRequesterDto } from '@soulsync/shared-types/biodata-visibility';

const ENCRYPTED_DISPLAY_PREFIX = 'enc:v1:';

export function isEncryptedDisplayName(value: string): boolean {
  return value.trim().startsWith(ENCRYPTED_DISPLAY_PREFIX);
}

export function formatRequesterLabel(requester: BiodataAccessRequestRequesterDto): string {
  const trimmed = requester.displayName?.trim();
  if (trimmed && !isEncryptedDisplayName(trimmed)) {
    return trimmed;
  }
  if (requester.username?.trim()) {
    return `@${requester.username.trim()}`;
  }
  return 'Member';
}
