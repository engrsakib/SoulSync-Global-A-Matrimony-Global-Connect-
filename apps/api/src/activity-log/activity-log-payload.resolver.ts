import type { ActivityLogLogicalPayload } from './activity-log.types';
import type { ActivityLogPayloadCryptoService } from './activity-log-payload-crypto.service';

export type ResolvedActivityPayload = {
  title: string;
  body: string | null;
  linkPath: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
};

export function resolveStoredActivityPayload(
  row: {
    title?: string | null;
    body?: string | null;
    linkPath?: string | null;
    metadata?: unknown;
    payloadEnc?: unknown;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
  crypto: ActivityLogPayloadCryptoService,
): ResolvedActivityPayload {
  const decrypted = crypto.decryptPayload(row.payloadEnc);
  if (decrypted) {
    return {
      title: decrypted.title,
      body: decrypted.body ?? null,
      linkPath: decrypted.linkPath,
      metadata: decrypted.metadata ?? null,
      ipAddress: decrypted.ipAddress ?? row.ipAddress ?? null,
      userAgent: decrypted.userAgent ?? row.userAgent ?? null,
    };
  }
  if (!row.title || !row.linkPath) {
    return {
      title: 'Activity',
      body: null,
      linkPath: '/dashboard',
      metadata: null,
      ipAddress: row.ipAddress ?? null,
      userAgent: row.userAgent ?? null,
    };
  }
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : null;
  return {
    title: row.title,
    body: row.body ?? null,
    linkPath: row.linkPath,
    metadata,
    ipAddress: row.ipAddress ?? null,
    userAgent: row.userAgent ?? null,
  };
}

export function normalizeWritePayload(
  entry: ActivityLogLogicalPayload | Partial<ActivityLogWriteEntryLegacy>,
): ActivityLogLogicalPayload {
  if ('payload' in entry && entry.payload) {
    return entry.payload;
  }
  const legacy = entry as ActivityLogWriteEntryLegacy;
  return {
    title: legacy.title ?? '',
    body: legacy.body ?? null,
    linkPath: legacy.linkPath ?? '',
    metadata: legacy.metadata ?? null,
    ipAddress: legacy.ipAddress ?? null,
    userAgent: legacy.userAgent ?? null,
    searchTerms: legacy.searchTerms,
  };
}

type ActivityLogWriteEntryLegacy = {
  title?: string;
  body?: string | null;
  linkPath?: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  searchTerms?: string[];
  payload?: ActivityLogLogicalPayload;
};
