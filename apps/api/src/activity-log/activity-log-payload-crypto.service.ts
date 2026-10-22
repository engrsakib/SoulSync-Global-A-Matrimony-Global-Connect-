import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import type { Env } from '../config/env.schema';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import type { ActivityLogLogicalPayload } from './activity-log.types';

export const ACTIVITY_PAYLOAD_SCHEMA_VERSION = 1;
const SEARCH_HMAC_CONTEXT = 'soulsync:activity-log:search:v1';

@Injectable()
export class ActivityLogPayloadCryptoService implements OnModuleInit {
  private searchKey!: Buffer;

  constructor(
    private readonly fieldCrypto: FieldEncryptionService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    const raw = this.config.get('BIODATA_MASTER_KEY', { infer: true });
    const master = Buffer.from(raw, 'base64url');
    if (master.length !== 32) {
      throw new Error('BIODATA_MASTER_KEY must decode to exactly 32 bytes (base64url)');
    }
    this.searchKey = createHmac('sha256', master).update(SEARCH_HMAC_CONTEXT).digest();
  }

  encryptPayload(payload: ActivityLogLogicalPayload): {
    payloadEnc: Record<string, unknown>;
    searchTokens: string[];
  } {
    const envelope: ActivityLogLogicalPayload = {
      ...payload,
      schemaVersion: ACTIVITY_PAYLOAD_SCHEMA_VERSION,
    };
    const payloadEnc = this.fieldCrypto.encryptJson({
      ...envelope,
    });
    if (!payloadEnc._encrypted) {
      throw new InternalServerErrorException('Activity payload encryption failed');
    }
    return {
      payloadEnc,
      searchTokens: this.buildSearchTokens(envelope),
    };
  }

  decryptPayload(payloadEnc: unknown): ActivityLogLogicalPayload | null {
    if (!payloadEnc) {
      return null;
    }
    const record = this.fieldCrypto.decryptJson(payloadEnc);
    if (!record || typeof record !== 'object') {
      return null;
    }
    const title = typeof record.title === 'string' ? record.title : '';
    const linkPath = typeof record.linkPath === 'string' ? record.linkPath : '';
    if (!title && !linkPath) {
      return null;
    }
    return {
      title,
      body: typeof record.body === 'string' ? record.body : null,
      linkPath,
      metadata:
        record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
          ? (record.metadata as Record<string, unknown>)
          : null,
      ipAddress: typeof record.ipAddress === 'string' ? record.ipAddress : null,
      userAgent: typeof record.userAgent === 'string' ? record.userAgent : null,
      schemaVersion:
        typeof record.schemaVersion === 'number' ? record.schemaVersion : undefined,
    };
  }

  tokensForQuery(query: string): string[] {
    const words = tokenizePlaintext(query);
    if (words.length === 0) {
      return [];
    }
    return words.map((word) => this.blindToken(word));
  }

  buildSearchTokens(payload: ActivityLogLogicalPayload): string[] {
    const parts: string[] = [
      payload.title,
      payload.body ?? '',
      ...(payload.searchTerms ?? []),
    ];
    const meta = payload.metadata;
    if (meta) {
      for (const key of ['sectionId', 'fieldNames', 'communitySlug', 'communityName'] as const) {
        const val = meta[key];
        if (typeof val === 'string') {
          parts.push(val);
        } else if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === 'string') {
              parts.push(item);
            }
          }
        }
      }
    }
    const words = tokenizePlaintext(parts.join(' '));
    return [...new Set(words.map((w) => this.blindToken(w)))];
  }

  private blindToken(normalizedWord: string): string {
    return createHmac('sha256', this.searchKey).update(normalizedWord).digest('hex');
  }
}

export function tokenizePlaintext(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);
  return [...new Set(normalized)];
}
