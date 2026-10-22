import type { MemberConfirmedMarriageDto } from './marriage-confirmation';
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
  /** Mutual marriage confirmations (always visible; not section-gated). */
  confirmedMarriages: MemberConfirmedMarriageDto[];
  sections: MemberBiodataViewSectionDto[];
};

export type MemberBiodataLinkPreviewDto = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bioPreview: string | null;
  canView: boolean;
  restrictionMessage: string | null;
};

export const BIODATA_LINK_PREVIEW_BIO_MAX_LENGTH = 160;

/** Matches absolute or path-only member biodata URLs. */
const BIODATA_URL_IN_TEXT_RE = /(?:https?:\/\/[^\s/]+)?\/biodata\/([a-z0-9_-]+)/gi;

export type PostBodySegment =
  { kind: 'text'; value: string } | { kind: 'biodata_url'; username: string; raw: string };

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

export function extractBiodataUsernamesFromText(text: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const match of text.matchAll(BIODATA_URL_IN_TEXT_RE)) {
    const username = match[1]?.toLowerCase();
    if (!username || seen.has(username)) {
      continue;
    }
    seen.add(username);
    ordered.push(username);
  }
  return ordered;
}

export function splitPostBodyForRender(text: string): PostBodySegment[] {
  const segments: PostBodySegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(BIODATA_URL_IN_TEXT_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ kind: 'text', value: text.slice(lastIndex, index) });
    }
    const username = match[1]?.toLowerCase();
    if (username) {
      segments.push({ kind: 'biodata_url', username, raw: match[0] });
    }
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

export function buildBiodataLinkPreviewFromMemberView(
  view: MemberBiodataViewDto,
): MemberBiodataLinkPreviewDto {
  const education = view.sections.find(
    (section) => section.sectionId === 'education_career' && section.access === 'visible',
  );
  const bioRaw = education?.content?.bio;
  const bio = typeof bioRaw === 'string' ? bioRaw.trim() : '';
  const bioPreview =
    bio.length > BIODATA_LINK_PREVIEW_BIO_MAX_LENGTH
      ? `${bio.slice(0, BIODATA_LINK_PREVIEW_BIO_MAX_LENGTH - 1).trimEnd()}…`
      : bio || null;

  return {
    username: view.owner.username,
    displayName: view.owner.displayName,
    avatarUrl: view.owner.avatarUrl,
    bioPreview,
    canView: true,
    restrictionMessage: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Coerce BFF/API JSON into a link preview (handles nested `{ data }` or full member view). */
export function normalizeMemberBiodataLinkPreview(
  value: unknown,
  fallbackUsername: string,
): MemberBiodataLinkPreviewDto {
  const normalizedFallback = fallbackUsername.trim().toLowerCase();

  let payload = value;
  if (isRecord(payload) && 'data' in payload && !('username' in payload) && !('owner' in payload)) {
    payload = payload.data;
  }

  if (isRecord(payload) && 'owner' in payload && isRecord(payload.owner)) {
    const owner = payload.owner;
    const username =
      typeof owner.username === 'string' ? owner.username.trim().toLowerCase() : normalizedFallback;
    const displayName = typeof owner.displayName === 'string' ? owner.displayName : `@${username}`;
    const avatarUrl = typeof owner.avatarUrl === 'string' ? owner.avatarUrl : null;
    const sections = Array.isArray(payload.sections) ? payload.sections : [];
    return buildBiodataLinkPreviewFromMemberView({
      owner: {
        id: typeof owner.id === 'string' ? owner.id : '',
        username,
        displayName,
        avatarUrl,
      },
      accessRequestOwnerUserId: '',
      confirmedMarriages: [],
      sections: sections as MemberBiodataViewDto['sections'],
    });
  }

  if (isRecord(payload) && typeof payload.username === 'string') {
    const username = payload.username.trim().toLowerCase() || normalizedFallback;
    return {
      username,
      displayName:
        typeof payload.displayName === 'string' && payload.displayName.trim()
          ? payload.displayName
          : `@${username}`,
      avatarUrl: typeof payload.avatarUrl === 'string' ? payload.avatarUrl : null,
      bioPreview:
        typeof payload.bioPreview === 'string' && payload.bioPreview.trim()
          ? payload.bioPreview
          : null,
      canView: payload.canView !== false,
      restrictionMessage:
        typeof payload.restrictionMessage === 'string' ? payload.restrictionMessage : null,
    };
  }

  return buildRestrictedBiodataLinkPreview(normalizedFallback, 'Could not load biodata preview.');
}

export function buildRestrictedBiodataLinkPreview(
  username: string,
  restrictionMessage: string,
): MemberBiodataLinkPreviewDto {
  const normalized = username.trim().toLowerCase();
  return {
    username: normalized,
    displayName: `@${normalized}`,
    avatarUrl: null,
    bioPreview: null,
    canView: false,
    restrictionMessage,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
