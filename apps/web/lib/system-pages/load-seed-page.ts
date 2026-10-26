import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SYSTEM_PAGE_SEED_CONTENT_UPDATED_AT,
  type SystemPageDto,
} from '@soulsync/shared-types/system-page';
import { SYSTEM_PAGE_SLUGS } from './constants';
import { SYSTEM_PAGE_SEED_DEFINITIONS } from './seed-manifest';

function systemPagesMarkdownDirs(): string[] {
  const cwd = process.cwd();
  return [
    join(cwd, 'data/system-pages'),
    join(cwd, '../../packages/db/data/system-pages'),
    join(cwd, 'packages/db/data/system-pages'),
  ];
}

function readMarkdownFile(filename: string): string | null {
  for (const dir of systemPagesMarkdownDirs()) {
    const path = join(dir, filename);
    if (existsSync(path)) {
      return readFileSync(path, 'utf8');
    }
  }
  return null;
}

function prevNextSlugs(slug: string): { prevSlug: string | null; nextSlug: string | null } {
  const order = [...SYSTEM_PAGE_SLUGS];
  const index = order.indexOf(slug as (typeof order)[number]);
  if (index === -1) {
    return { prevSlug: null, nextSlug: null };
  }
  return {
    prevSlug: index > 0 ? (order[index - 1] ?? null) : null,
    nextSlug: index >= 0 && index < order.length - 1 ? (order[index + 1] ?? null) : null,
  };
}

export function loadSystemPageFromSeed(slug: string): SystemPageDto | null {
  const definition = SYSTEM_PAGE_SEED_DEFINITIONS.find((page) => page.slug === slug);
  if (!definition) {
    return null;
  }
  const markdown = readMarkdownFile(definition.markdownFile);
  if (!markdown) {
    return null;
  }
  const { prevSlug, nextSlug } = prevNextSlugs(slug);
  return {
    slug: definition.slug,
    title: definition.title,
    markdown,
    updatedAt: SYSTEM_PAGE_SEED_CONTENT_UPDATED_AT,
    sidebar: definition.sidebar,
    prevSlug,
    nextSlug,
  };
}
