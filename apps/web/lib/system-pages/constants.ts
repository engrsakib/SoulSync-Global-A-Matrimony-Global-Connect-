export const SYSTEM_PAGE_SLUGS = [
  'terms',
  'privacy-policy',
  'safety',
  'return-refund',
] as const;

export type SystemPageSlug = (typeof SYSTEM_PAGE_SLUGS)[number];

export function isSystemPageSlug(value: string): value is SystemPageSlug {
  return (SYSTEM_PAGE_SLUGS as readonly string[]).includes(value);
}
