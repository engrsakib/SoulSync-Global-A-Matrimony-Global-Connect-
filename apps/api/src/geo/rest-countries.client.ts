import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GeoCountryDetail, GeoCountrySummary } from '@soulsync/shared-types/geo';
import type { Env } from '../config/env.schema';
import {
  mapRestCountryDetail,
  mapRestCountrySummary,
  readRestCountriesError,
  readRestCountriesObjects,
  restCountriesHasMore,
} from './rest-countries.mapper';

const LIST_FIELDS = 'names.common,codes.alpha_2';
const DETAIL_FIELDS =
  'names.common,codes.alpha_2,languages,timezones,postal_code.format,postal_code.regex';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry<T> = { expiresAt: number; value: T };

@Injectable()
export class RestCountriesClient {
  private fullListCache: CacheEntry<GeoCountrySummary[]> | null = null;
  private detailCache = new Map<string, CacheEntry<GeoCountryDetail>>();

  constructor(private readonly config: ConfigService<Env, true>) {}

  async listCountries(query?: string, limit = 100): Promise<GeoCountrySummary[]> {
    const q = query?.trim();
    if (!q) {
      return this.getFullCountryList();
    }
    const capped = Math.min(Math.max(limit, 1), 100);
    const url = this.buildUrl({
      q,
      limit: String(capped),
      response_fields: LIST_FIELDS,
    });
    const body = await this.fetchJson(url);
    return readRestCountriesObjects(body)
      .map(mapRestCountrySummary)
      .filter((c): c is GeoCountrySummary => c !== null);
  }

  async getCountryByAlpha2(alpha2: string): Promise<GeoCountryDetail | null> {
    const code = alpha2.trim().toUpperCase();
    if (code.length !== 2) {
      return null;
    }
    const cached = this.detailCache.get(code);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    const url = this.buildUrl({
      'codes.alpha_2': code,
      limit: '1',
      response_fields: DETAIL_FIELDS,
    });
    const body = await this.fetchJson(url);
    const obj = readRestCountriesObjects(body)[0];
    const detail = obj ? mapRestCountryDetail(obj) : null;
    if (detail) {
      this.detailCache.set(code, { value: detail, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return detail;
  }

  private async getFullCountryList(): Promise<GeoCountrySummary[]> {
    if (this.fullListCache && this.fullListCache.expiresAt > Date.now()) {
      return this.fullListCache.value;
    }
    const all: GeoCountrySummary[] = [];
    let offset = 0;
    const limit = 100;
    for (;;) {
      const url = this.buildUrl({
        limit: String(limit),
        offset: String(offset),
        response_fields: LIST_FIELDS,
      });
      const body = await this.fetchJson(url);
      const page = readRestCountriesObjects(body)
        .map(mapRestCountrySummary)
        .filter((c): c is GeoCountrySummary => c !== null);
      all.push(...page);
      if (!restCountriesHasMore(body)) {
        break;
      }
      offset += limit;
    }
    all.sort((a, b) => a.name.localeCompare(b.name));
    this.fullListCache = { value: all, expiresAt: Date.now() + CACHE_TTL_MS };
    return all;
  }

  private buildUrl(params: Record<string, string>): string {
    const base = this.config.get('REST_COUNTRIES_API_URL', { infer: true }).replace(/\/$/, '');
    const search = new URLSearchParams(params);
    return `${base}?${search.toString()}`;
  }

  private async fetchJson(url: string): Promise<unknown> {
    const key = this.config.get('REST_COUNTRIES_API_KEY', { infer: true });
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const body: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        readRestCountriesError(body) ?? `REST Countries request failed (${response.status})`;
      throw new ServiceUnavailableException(message);
    }
    return body;
  }
}
