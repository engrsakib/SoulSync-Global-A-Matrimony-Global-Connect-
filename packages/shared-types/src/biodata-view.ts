import type { ShareableBiodataSectionId } from './biodata-visibility';

export const BIODATA_SECTION_VIEWER_ACCESS = [
  'visible',
  'locked',
  'pending',
  'denied',
  'expired',
  'not_applicable',
] as const;

export type BiodataSectionViewerAccess = (typeof BIODATA_SECTION_VIEWER_ACCESS)[number];

export type MemberBiodataViewOwnerDto = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type MemberBiodataViewSectionDto = {
  sectionId: ShareableBiodataSectionId;
  title: string;
  access: BiodataSectionViewerAccess;
  /** Decrypted section fields when access is `visible`. */
  content?: Record<string, unknown>;
};

export type MemberBiodataViewDto = {
  owner: MemberBiodataViewOwnerDto;
  /** Use when creating access requests from the viewer UI. */
  accessRequestOwnerUserId: string;
  sections: MemberBiodataViewSectionDto[];
};

export function buildMemberBiodataShareUrl(baseUrl: string, username: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const normalizedUsername = username.trim().toLowerCase();
  return `${trimmedBase}/biodata/${encodeURIComponent(normalizedUsername)}`;
}

/** True when `text` already contains this member biodata share URL (any origin). */
export function postBodyIncludesBiodataShareLink(text: string, username: string): boolean {
  const normalized = username.trim().toLowerCase();
  const pattern = new RegExp(`/biodata/${escapeRegExp(normalized)}(?:\\?|#|$|[^a-z0-9_-])`, 'i');
  return pattern.test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
