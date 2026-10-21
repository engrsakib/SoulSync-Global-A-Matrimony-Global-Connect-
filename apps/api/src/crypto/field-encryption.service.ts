import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import {
  BIODATA_ENC_PREFIX,
  decryptWithKey,
  encryptWithKey,
  isEncryptedValue,
} from './field-crypto';

export { BIODATA_ENC_PREFIX };

@Injectable()
export class FieldEncryptionService implements OnModuleInit {
  private key!: Buffer;

  constructor(private readonly config: ConfigService<Env, true>) {}

  onModuleInit(): void {
    this.key = this.resolveKey();
  }

  private resolveKey(): Buffer {
    const raw = this.config.get('BIODATA_MASTER_KEY', { infer: true });
    const decoded = Buffer.from(raw, 'base64url');
    if (decoded.length !== 32) {
      throw new Error('BIODATA_MASTER_KEY must decode to exactly 32 bytes (base64url)');
    }
    return decoded;
  }

  isEncrypted(value: string): boolean {
    return isEncryptedValue(value);
  }

  encryptString(plain: string | null | undefined): string | null {
    if (plain == null || plain === '') {
      return null;
    }
    if (this.isEncrypted(plain)) {
      return plain;
    }
    return encryptWithKey(plain, this.key);
  }

  decryptString(stored: string | null | undefined): string | null {
    if (stored == null || stored === '') {
      return null;
    }
    return decryptWithKey(stored, this.key);
  }

  encryptStringArray(values: string[] | null | undefined): string[] {
    if (!values?.length) {
      return [];
    }
    return values.map((item) => this.encryptString(item) ?? item);
  }

  decryptStringArray(values: string[] | null | undefined): string[] {
    if (!values?.length) {
      return [];
    }
    return values.map((item) => this.decryptString(item) ?? item);
  }

  encryptJson(value: Record<string, unknown> | null | undefined): Record<string, unknown> {
    if (!value || Object.keys(value).length === 0) {
      return {};
    }
    const serialized = JSON.stringify(value);
    const enc = this.encryptString(serialized);
    return enc ? { _encrypted: enc } : {};
  }

  decryptJson(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    const record = value as Record<string, unknown>;
    if (typeof record._encrypted === 'string') {
      const plain = this.decryptString(record._encrypted);
      if (!plain) {
        return {};
      }
      try {
        const parsed: unknown = JSON.parse(plain);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }
    return record;
  }
}
