import type { UserActivityType } from '@soulsync/db';

export type ActivityLogWriteEntry = {
  tenantId: string;
  userId: string;
  type: UserActivityType;
  title: string;
  body?: string | null;
  linkPath: string;
  actorUserId?: string | null;
  relatedUserId?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: string;
};

export type PersistActivityLogJobPayload = {
  entries: ActivityLogWriteEntry[];
};
