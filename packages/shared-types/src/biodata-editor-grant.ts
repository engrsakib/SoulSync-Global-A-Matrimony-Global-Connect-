export const BIODATA_EDITOR_GRANT_STATUSES = [
  'PENDING',
  'APPROVED',
  'DENIED',
  'REVOKED',
  'EXPIRED',
] as const;

export type BiodataEditorGrantStatus = (typeof BIODATA_EDITOR_GRANT_STATUSES)[number];

export const BIODATA_EDITOR_GRANT_INITIATED_BY = ['OWNER', 'EDITOR'] as const;

export type BiodataEditorGrantInitiatedBy = (typeof BIODATA_EDITOR_GRANT_INITIATED_BY)[number];

export const BIODATA_EDITOR_GRANT_DECISIONS = ['approve', 'deny', 'revoke'] as const;

export type BiodataEditorGrantDecision = (typeof BIODATA_EDITOR_GRANT_DECISIONS)[number];

export const BIODATA_EDITOR_SCOPES = ['CONTENT', 'SETTINGS', 'BOTH'] as const;

export type BiodataEditorScope = (typeof BIODATA_EDITOR_SCOPES)[number];

export function scopeAllowsContent(scope: BiodataEditorScope): boolean {
  return scope === 'CONTENT' || scope === 'BOTH';
}

export function scopeAllowsSettings(scope: BiodataEditorScope): boolean {
  return scope === 'SETTINGS' || scope === 'BOTH';
}

export function scopeLabel(scope: BiodataEditorScope): string {
  switch (scope) {
    case 'CONTENT':
      return 'Biodata content';
    case 'SETTINGS':
      return 'Settings & approvals';
    case 'BOTH':
      return 'Content & settings';
    default:
      return scope;
  }
}

export type BiodataEditorGrantUserDto = {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type BiodataEditorGrantDto = {
  id: string;
  ownerUserId: string;
  editorUserId: string;
  status: BiodataEditorGrantStatus;
  initiatedBy: BiodataEditorGrantInitiatedBy;
  scope: BiodataEditorScope;
  message: string | null;
  expiresAt: string | null;
  approvedAt: string | null;
  revokedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  owner: BiodataEditorGrantUserDto;
  editor: BiodataEditorGrantUserDto;
};

export type BiodataEditorGrantOwnerListDto = {
  pendingIncoming: BiodataEditorGrantDto[];
  pendingOutgoing: BiodataEditorGrantDto[];
  activeEditors: BiodataEditorGrantDto[];
  history: BiodataEditorGrantDto[];
};

export type BiodataEditorGrantEditorListDto = {
  pendingInvites: BiodataEditorGrantDto[];
  pendingOutgoing: BiodataEditorGrantDto[];
  activeManaged: BiodataManagedProfileSummaryDto[];
  history: BiodataEditorGrantDto[];
};

export type BiodataManagedProfileSummaryDto = {
  grantId: string;
  ownerUserId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  scope: BiodataEditorScope;
  completenessPercent: number;
  profileUpdatedAt: string | null;
  pendingViewAccessCount?: number;
};

export type InviteBiodataEditorDto = {
  editorUsername: string;
  message?: string;
  scope?: BiodataEditorScope;
};

export type RequestBiodataEditorAccessDto = {
  ownerUsername: string;
  message?: string;
};

export type DecideBiodataEditorGrantDto = {
  decision: BiodataEditorGrantDecision;
  /** Required when owner approves an editor-initiated request. Ignored on deny/revoke. */
  scope?: BiodataEditorScope;
};

export type UpdateBiodataEditorGrantScopeDto = {
  scope: BiodataEditorScope;
};

export type TenantMemberUsernameSearchDto = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export function effectiveEditorGrantStatus(
  status: BiodataEditorGrantStatus,
  expiresAt: string | null,
  now = Date.now(),
): BiodataEditorGrantStatus {
  if (status !== 'APPROVED' || !expiresAt) {
    return status;
  }
  return new Date(expiresAt).getTime() <= now ? 'EXPIRED' : status;
}
