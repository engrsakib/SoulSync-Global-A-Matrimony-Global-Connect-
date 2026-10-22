/** Sections exposed on member biodata viewer (includes gallery; not all are patchable via section PATCH). */
export const SHAREABLE_BIODATA_SECTION_IDS = [
  'basic',
  'photo_gallery',
  'faith',
  'islam_sharia',
  'location',
  'education_career',
  'family_heritage',
  'my_attributes',
  'partner',
  'partner_location',
  'guardian_contact',
] as const;

export type ShareableBiodataSectionId = (typeof SHAREABLE_BIODATA_SECTION_IDS)[number];

/** Always visible to others; cannot be set to REQUEST. */
export const LOCKED_DIRECT_BIODATA_SECTION_IDS = [
  'basic',
] as const satisfies readonly ShareableBiodataSectionId[];

/** Always requires permission; cannot be set to DIRECT. */
export const LOCKED_REQUEST_BIODATA_SECTION_IDS = [
  'photo_gallery',
] as const satisfies readonly ShareableBiodataSectionId[];

/** Excluded from “request whole biodata access” batch; use per-section request instead. */
export const WHOLE_BIODATA_BATCH_EXCLUDED_SECTION_IDS = [
  'photo_gallery',
] as const satisfies readonly ShareableBiodataSectionId[];

export const BIODATA_SECTION_VISIBILITY_MODES = ['DIRECT', 'REQUEST'] as const;
export type BiodataSectionVisibilityMode = (typeof BIODATA_SECTION_VISIBILITY_MODES)[number];

export const BIODATA_ACCESS_REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'DENIED',
  'REVOKED',
  'EXPIRED',
] as const;
export type BiodataAccessRequestStatus = (typeof BIODATA_ACCESS_REQUEST_STATUSES)[number];

export const BIODATA_ACCESS_DECISIONS = ['approve', 'deny', 'revoke'] as const;
export type BiodataAccessDecision = (typeof BIODATA_ACCESS_DECISIONS)[number];

export const BIODATA_ACCESS_APPROVE_AUDIENCES = ['requester', 'everyone'] as const;
export type BiodataAccessApproveAudience = (typeof BIODATA_ACCESS_APPROVE_AUDIENCES)[number];

export const SHAREABLE_BIODATA_SECTION_TITLES: Record<ShareableBiodataSectionId, string> = {
  basic: 'Personal details',
  photo_gallery: 'Photo gallery',
  faith: 'Religion & practice',
  islam_sharia: 'Religious Beliefs, Practices, and Sharia Compliance',
  location: 'Location',
  education_career: 'Education & career',
  family_heritage: 'Family heritage and identity',
  my_attributes: 'About me (for matching)',
  partner: 'Partner preferences',
  partner_location: 'Partner Location',
  guardian_contact: 'Guardian contact & marriage pledges',
};

export function isShareableBiodataSectionId(value: string): value is ShareableBiodataSectionId {
  return (SHAREABLE_BIODATA_SECTION_IDS as readonly string[]).includes(value);
}

export function defaultVisibilityModeForSection(
  sectionId: ShareableBiodataSectionId,
): BiodataSectionVisibilityMode {
  if ((LOCKED_DIRECT_BIODATA_SECTION_IDS as readonly string[]).includes(sectionId)) {
    return 'DIRECT';
  }
  if ((LOCKED_REQUEST_BIODATA_SECTION_IDS as readonly string[]).includes(sectionId)) {
    return 'REQUEST';
  }
  return 'REQUEST';
}

export type BiodataSectionVisibilityRowDto = {
  sectionId: ShareableBiodataSectionId;
  title: string;
  mode: BiodataSectionVisibilityMode;
  locked: boolean;
};

export type BiodataVisibilityPolicyDto = {
  sections: BiodataSectionVisibilityRowDto[];
};

export type BiodataVisibilityPatchDto = {
  sections: Array<{
    sectionId: ShareableBiodataSectionId;
    mode: BiodataSectionVisibilityMode;
  }>;
};

export type BiodataAccessRequestRequesterDto = {
  id: string;
  displayName: string;
  username: string | null;
};

export type BiodataAccessRequestDto = {
  id: string;
  sectionId: ShareableBiodataSectionId;
  sectionTitle: string;
  status: BiodataAccessRequestStatus;
  message: string | null;
  expiresAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  requester: BiodataAccessRequestRequesterDto;
};

export type BiodataAccessRequestListDto = {
  pending: BiodataAccessRequestDto[];
  history: BiodataAccessRequestDto[];
};

export type CreateBiodataAccessRequestDto = {
  ownerUserId: string;
  sectionId: ShareableBiodataSectionId;
  message?: string;
};

export type DecideBiodataAccessRequestDto = {
  decision: BiodataAccessDecision;
  audience?: BiodataAccessApproveAudience;
  /** ISO date-time; omit when `forever` is true. */
  expiresAt?: string;
  forever?: boolean;
};

export function resolveVisibilityPolicy(
  stored: Array<{ sectionId: string; mode: BiodataSectionVisibilityMode }>,
): BiodataVisibilityPolicyDto {
  const bySection = new Map(stored.map((row) => [row.sectionId, row.mode]));

  return {
    sections: SHAREABLE_BIODATA_SECTION_IDS.map((sectionId) => {
      const lockedDirect = (LOCKED_DIRECT_BIODATA_SECTION_IDS as readonly string[]).includes(
        sectionId,
      );
      const lockedRequest = (LOCKED_REQUEST_BIODATA_SECTION_IDS as readonly string[]).includes(
        sectionId,
      );
      const locked = lockedDirect || lockedRequest;
      let mode: BiodataSectionVisibilityMode;
      if (lockedDirect) {
        mode = 'DIRECT';
      } else if (lockedRequest) {
        mode = 'REQUEST';
      } else {
        mode = bySection.get(sectionId) ?? defaultVisibilityModeForSection(sectionId);
      }
      return {
        sectionId,
        title: SHAREABLE_BIODATA_SECTION_TITLES[sectionId],
        mode,
        locked,
      };
    }),
  };
}

export function effectiveAccessRequestStatus(
  status: BiodataAccessRequestStatus,
  expiresAt: Date | null,
  now: Date = new Date(),
): BiodataAccessRequestStatus {
  if (status === 'APPROVED' && expiresAt && expiresAt.getTime() <= now.getTime()) {
    return 'EXPIRED';
  }
  return status;
}
