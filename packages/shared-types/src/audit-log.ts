export const AUDIT_EVENT_STATUSES = ['SUCCESS', 'FAILURE'] as const;
export type AuditEventStatusDto = (typeof AUDIT_EVENT_STATUSES)[number];

export const AUDIT_EVENT_TYPES = [
  'PROFILE_UPDATED',
  'BIODATA_UPDATED',
  'BIODATA_UPDATED_BY_EDITOR',
  'BIODATA_EDITED_FOR_OWNER',
  'BIODATA_ACCESS_REQUEST_SENT',
  'BIODATA_ACCESS_REQUEST_RECEIVED',
  'BIODATA_ACCESS_REQUEST_DECIDED',
  'BIODATA_EDITOR_INVITE',
  'BIODATA_EDITOR_REQUEST',
  'BIODATA_EDITOR_DECIDED',
  'COMMUNITY_COMMENT_CREATED',
  'COMMUNITY_COMMENT_REPLY',
  'COMMUNITY_REACTION_ADDED',
  'COMMUNITY_REACTION_REMOVED',
  'COMMUNITY_REACTION_CHANGED',
  'COMMUNITY_POST_CREATED',
  'COMMUNITY_POST_UPDATED',
  'BIODATA_VIEWED',
  'BIODATA_PAGE_VIEWED',
  'BIODATA_PRIVACY_UPDATED',
  'BIODATA_GALLERY_UPDATED',
  'ACCOUNT_REGISTERED',
  'USERNAME_UPDATED',
  'AVATAR_UPDATED',
  'PASSWORD_UPDATED',
  'ACCOUNT_SETTINGS_UPDATED',
  'SESSION_LOGOUT',
  'COMMUNITY_JOINED',
  'COMMUNITY_JOIN_REQUESTED',
  'COMMUNITY_JOIN_REQUEST_DECIDED',
  'COMMUNITY_LEFT',
  'COMMUNITY_MEMBER_REMOVED',
  'MARRIAGE_CONFIRMATION_SENT',
  'MARRIAGE_CONFIRMATION_RECEIVED',
  'MARRIAGE_CONFIRMATION_DECIDED',
  'MARRIAGE_CONFIRMED',
  'AUTH_LOGIN',
  'AUTH_LOGIN_FAILED',
  'AUTH_REFRESH',
  'AUTH_REFRESH_FAILED',
  'AUTH_REGISTER',
  'AUTH_GUEST_CREATED',
  'AUTH_GUEST_LOGIN',
  'AUTH_LOGOUT',
  'AUTH_SESSION_REVOKED',
  'AUTH_SESSION_EXPIRED',
] as const;

export type AuditEventTypeDto = (typeof AUDIT_EVENT_TYPES)[number];

export type AuditLogUserSnippetDto = {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AuditEventDto = {
  id: string;
  tenantId: string;
  type: AuditEventTypeDto;
  status: AuditEventStatusDto;
  title: string;
  actor: AuditLogUserSnippetDto | null;
  target: AuditLogUserSnippetDto | null;
  linkPath: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
};

export type AuditEventListDto = {
  items: AuditEventDto[];
  nextCursor: string | null;
};
