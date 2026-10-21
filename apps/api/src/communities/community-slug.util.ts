const MAX_SLUG_LENGTH = 60;

export function slugifyCommunityName(name: string): string {
  const normalized = name.normalize('NFKD').replace(/\p{M}/gu, '');
  let slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length > MAX_SLUG_LENGTH) {
    slug = slug.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, '');
  }

  return slug.length > 0 ? slug : 'community';
}
