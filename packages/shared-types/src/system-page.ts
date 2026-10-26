export type SystemPageSidebarTone = 'high' | 'medium' | 'low';

export type SystemPageSidebarCardDto = {
  id: string;
  tone: SystemPageSidebarTone;
  category: string;
  title: string;
  body: string;
  iconKey?: string;
};

export type SystemPageDto = {
  slug: string;
  title: string;
  markdown: string;
  updatedAt: string;
  sidebar: SystemPageSidebarCardDto[];
  prevSlug: string | null;
  nextSlug: string | null;
};

export type SystemPageIndexItemDto = {
  slug: string;
  title: string;
  sortOrder: number;
};

/** Display date for seeded policy markdown (web seed fallback + db:seed). */
export const SYSTEM_PAGE_SEED_CONTENT_UPDATED_AT = '2026-10-26T12:00:00.000Z';

const SIDEBAR_TONES: SystemPageSidebarTone[] = ['high', 'medium', 'low'];

function isSidebarCard(value: unknown): value is SystemPageSidebarCardDto {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.category === 'string' &&
    typeof row.title === 'string' &&
    typeof row.body === 'string' &&
    SIDEBAR_TONES.includes(row.tone as SystemPageSidebarTone) &&
    (row.iconKey === undefined || typeof row.iconKey === 'string')
  );
}

export function isSystemPageDto(value: unknown): value is SystemPageDto {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const row = value as Record<string, unknown>;
  if (
    typeof row.slug !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.markdown !== 'string' ||
    typeof row.updatedAt !== 'string' ||
    !Array.isArray(row.sidebar)
  ) {
    return false;
  }
  if (!row.sidebar.every(isSidebarCard)) {
    return false;
  }
  if (row.prevSlug !== null && typeof row.prevSlug !== 'string') {
    return false;
  }
  if (row.nextSlug !== null && typeof row.nextSlug !== 'string') {
    return false;
  }
  return true;
}
