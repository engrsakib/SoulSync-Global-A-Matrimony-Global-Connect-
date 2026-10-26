import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@soulsync/db';
import {
  isSystemPageDto,
  type SystemPageDto,
  type SystemPageIndexItemDto,
  type SystemPageSidebarCardDto,
} from '@soulsync/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { getRedisCachedJson } from '../redis/redis-cached-json';

const CACHE_TTL_SECONDS = 86_400;
const LOCK_TTL_SECONDS = 30;
const WAIT_MAX_MS = 5_000;

function cacheKey(slug: string): string {
  return `system:page:v1:${slug}`;
}

function lockKey(slug: string): string {
  return `system:page:lock:v1:${slug}`;
}

function indexCacheKey(): string {
  return 'system:pages:v1:index';
}

function indexLockKey(): string {
  return 'system:pages:lock:v1:index';
}

function parseSidebar(value: Prisma.JsonValue | null): SystemPageSidebarCardDto[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value.filter((row): row is SystemPageSidebarCardDto => {
    if (!row || typeof row !== 'object') {
      return false;
    }
    const item = row as Record<string, unknown>;
    return (
      typeof item.id === 'string' &&
      typeof item.category === 'string' &&
      typeof item.title === 'string' &&
      typeof item.body === 'string' &&
      (item.tone === 'high' || item.tone === 'medium' || item.tone === 'low')
    );
  });
}

@Injectable()
export class SystemPagesService {
  private slugOrder: string[] | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async orderedSlugs(): Promise<string[]> {
    if (this.slugOrder) {
      return this.slugOrder;
    }
    const rows = await this.prisma.client.systemPage.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { slug: true },
    });
    this.slugOrder = rows.map((row) => row.slug);
    return this.slugOrder;
  }

  private prevNext(slug: string, order: string[]): { prevSlug: string | null; nextSlug: string | null } {
    const index = order.indexOf(slug);
    if (index === -1) {
      return { prevSlug: null, nextSlug: null };
    }
    return {
      prevSlug: index > 0 ? (order[index - 1] ?? null) : null,
      nextSlug: index >= 0 && index < order.length - 1 ? (order[index + 1] ?? null) : null,
    };
  }

  private rowToDto(
    row: {
      slug: string;
      title: string;
      markdown: string;
      updatedAt: Date;
      sidebar: Prisma.JsonValue | null;
    },
    order: string[],
  ): SystemPageDto {
    const { prevSlug, nextSlug } = this.prevNext(row.slug, order);
    return {
      slug: row.slug,
      title: row.title,
      markdown: row.markdown,
      updatedAt: row.updatedAt.toISOString(),
      sidebar: parseSidebar(row.sidebar),
      prevSlug,
      nextSlug,
    };
  }

  async getBySlug(slug: string): Promise<SystemPageDto> {
    const trimmed = slug.trim();
    if (!trimmed) {
      throw new NotFoundException('System page not found');
    }

    return getRedisCachedJson(this.redis.client, {
      cacheKey: cacheKey(trimmed),
      lockKey: lockKey(trimmed),
      cacheTtlSeconds: CACHE_TTL_SECONDS,
      lockTtlSeconds: LOCK_TTL_SECONDS,
      waitMaxMs: WAIT_MAX_MS,
      parse: (raw) => {
        try {
          const value: unknown = JSON.parse(raw);
          return isSystemPageDto(value) ? value : null;
        } catch {
          return null;
        }
      },
      load: async () => {
        const [row, order] = await Promise.all([
          this.prisma.client.systemPage.findUnique({ where: { slug: trimmed } }),
          this.orderedSlugs(),
        ]);
        if (!row) {
          throw new NotFoundException('System page not found');
        }
        return this.rowToDto(row, order);
      },
    });
  }

  async listIndex(): Promise<SystemPageIndexItemDto[]> {
    return getRedisCachedJson(this.redis.client, {
      cacheKey: indexCacheKey(),
      lockKey: indexLockKey(),
      cacheTtlSeconds: CACHE_TTL_SECONDS,
      lockTtlSeconds: LOCK_TTL_SECONDS,
      waitMaxMs: WAIT_MAX_MS,
      parse: (raw) => {
        try {
          const value: unknown = JSON.parse(raw);
          if (!Array.isArray(value)) {
            return null;
          }
          const ok = value.every(
            (item) =>
              item &&
              typeof item === 'object' &&
              typeof (item as SystemPageIndexItemDto).slug === 'string' &&
              typeof (item as SystemPageIndexItemDto).title === 'string' &&
              typeof (item as SystemPageIndexItemDto).sortOrder === 'number',
          );
          return ok ? (value as SystemPageIndexItemDto[]) : null;
        } catch {
          return null;
        }
      },
      load: async () => {
        const rows = await this.prisma.client.systemPage.findMany({
          orderBy: { sortOrder: 'asc' },
          select: { slug: true, title: true, sortOrder: true },
        });
        return rows.map((row) => ({
          slug: row.slug,
          title: row.title,
          sortOrder: row.sortOrder,
        }));
      },
    });
  }
}
