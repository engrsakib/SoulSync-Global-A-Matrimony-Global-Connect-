import type { ActivityLogLogicalPayload } from './activity-log.types';

export function activityPayload(input: {
  title: string;
  body?: string | null;
  linkPath: string;
  metadata?: Record<string, unknown> | null;
  searchTerms?: string[];
}): ActivityLogLogicalPayload {
  return {
    title: input.title,
    body: input.body ?? null,
    linkPath: input.linkPath,
    metadata: input.metadata ?? null,
    searchTerms: input.searchTerms,
  };
}
