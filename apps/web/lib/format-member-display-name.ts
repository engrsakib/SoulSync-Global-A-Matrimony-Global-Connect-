import { isEncryptedDisplayName } from '@/lib/format-requester-display-name';

export function formatMemberDisplayName(
  displayName: string | null | undefined,
  _username?: string,
): string | null {
  const trimmed = displayName?.trim();
  if (trimmed && !isEncryptedDisplayName(trimmed)) {
    return trimmed;
  }
  return null;
}
