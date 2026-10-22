import type { AuditEventStatus, AuditEventType, UserActivityType } from '@soulsync/db';

export type ActivityLogLogicalPayload = {
  title: string;
  body?: string | null;
  linkPath: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  schemaVersion?: number;
  /** Normalized plaintext terms indexed for blind search (never stored). */
  searchTerms?: string[];
};

export type ActivityLogWriteEntry = {
  tenantId: string;
  userId: string;
  type: UserActivityType;
  payload?: ActivityLogLogicalPayload;
  /** @deprecated use payload — normalized at persist time */
  title?: string;
  body?: string | null;
  linkPath?: string;
  metadata?: Record<string, unknown> | null;
  actorUserId?: string | null;
  relatedUserId?: string | null;
  occurredAt?: string;
};

export type AuditLogWriteEntry = {
  tenantId: string;
  type: AuditEventType;
  status?: AuditEventStatus;
  actorUserId?: string | null;
  targetUserId?: string | null;
  payload?: ActivityLogLogicalPayload;
  /** @deprecated use payload */
  linkPath?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  occurredAt?: string;
  dedupeDaily?: boolean;
};

export type ActivityLogPersistEvent = {
  audit?: AuditLogWriteEntry | null;
  entries: ActivityLogWriteEntry[];
};

export type PersistActivityLogJobPayload = {
  events: ActivityLogPersistEvent[];
};

export function userActivityToAuditType(type: UserActivityType): AuditEventType {
  return type;
}

export type ActivityLogListSort = 'newest' | 'oldest';

export type ActivityLogListQuery = {
  types?: UserActivityType[];
  dateFrom?: Date;
  dateTo?: Date;
  q?: string;
  sort?: ActivityLogListSort;
  cursor?: string;
  limit?: number;
};

const AUDIT_DEFAULT_TITLES: Partial<Record<AuditEventType, string>> = {
  AUTH_LOGIN: 'Signed in',
  AUTH_LOGIN_FAILED: 'Sign-in failed',
  AUTH_REFRESH: 'Session refreshed',
  AUTH_REFRESH_FAILED: 'Session refresh failed',
  AUTH_REGISTER: 'Account registered',
  AUTH_GUEST_CREATED: 'Guest account created',
  AUTH_GUEST_LOGIN: 'Guest signed in',
  AUTH_LOGOUT: 'Signed out',
  AUTH_SESSION_REVOKED: 'Session revoked',
  AUTH_SESSION_EXPIRED: 'Session expired',
  BIODATA_VIEWED: 'Biodata viewed',
  BIODATA_PRIVACY_UPDATED: 'Updated biodata privacy settings',
};

export function normalizeActivityWriteEntry(entry: ActivityLogWriteEntry): ActivityLogWriteEntry {
  if (entry.payload?.title && entry.payload.linkPath) {
    return entry;
  }
  return {
    ...entry,
    payload: {
      title: entry.payload?.title ?? entry.title ?? 'Activity',
      body: entry.payload?.body ?? entry.body ?? null,
      linkPath: entry.payload?.linkPath ?? entry.linkPath ?? '/dashboard',
      metadata: entry.payload?.metadata ?? entry.metadata ?? null,
      searchTerms: entry.payload?.searchTerms,
    },
  };
}

export function normalizeAuditWriteEntry(entry: AuditLogWriteEntry): AuditLogWriteEntry {
  if (entry.payload?.title) {
    return {
      ...entry,
      payload: {
        ...entry.payload,
        linkPath: entry.payload.linkPath ?? entry.linkPath ?? '/dashboard',
        metadata: entry.payload.metadata ?? entry.metadata ?? null,
        ipAddress: entry.payload.ipAddress ?? entry.ipAddress ?? null,
        userAgent: entry.payload.userAgent ?? entry.userAgent ?? null,
      },
    };
  }
  const title = AUDIT_DEFAULT_TITLES[entry.type] ?? 'Audit event';
  return {
    ...entry,
    payload: {
      title,
      linkPath: entry.linkPath ?? '/dashboard',
      metadata: entry.metadata ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  };
}
