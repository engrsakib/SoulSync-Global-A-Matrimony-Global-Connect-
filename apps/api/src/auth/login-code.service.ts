import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateLoginCode, normalizeLoginCode } from '@soulsync/shared-types';
import type { Env } from '../config/env.schema';
import { PasswordService } from './password.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoginCodeService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
  ) {}

  private getPepper(): string {
    return (
      this.config.get('LOGIN_CODE_PEPPER', { infer: true }) ??
      this.config.get('JWT_ACCESS_SECRET', { infer: true })
    );
  }

  fingerprint(normalizedCode: string): string {
    return createHmac('sha256', this.getPepper()).update(normalizedCode).digest('hex');
  }

  async hashCode(normalizedCode: string): Promise<string> {
    return this.passwordService.hash(normalizedCode);
  }

  async verifyCode(normalizedCode: string, hash: string): Promise<boolean> {
    return this.passwordService.compare(normalizedCode, hash);
  }

  /** Generate a unique 16-digit code (retries on fingerprint collision). */
  async generateUniqueCode(maxAttempts = 12): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const plain = generateLoginCode();
      const fp = this.fingerprint(plain);
      const existing = await this.prisma.client.user.findUnique({
        where: { loginCodeFingerprint: fp },
        select: { id: true },
      });
      if (!existing) {
        return plain;
      }
    }
    throw new Error('Unable to generate a unique login code');
  }

  normalize(input: string): string {
    return normalizeLoginCode(input);
  }

  encryptPlainLoginCode(plain: string): string {
    const key = scryptSync(this.getPepper(), 'soulsync-login-code-v1', 32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  decryptStoredLoginCode(payload: string | null | undefined): string | null {
    if (!payload) {
      return null;
    }
    const parts = payload.split('.');
    if (parts.length !== 3) {
      return null;
    }
    try {
      const key = scryptSync(this.getPepper(), 'soulsync-login-code-v1', 32);
      const iv = Buffer.from(parts[0]!, 'base64url');
      const tag = Buffer.from(parts[1]!, 'base64url');
      const data = Buffer.from(parts[2]!, 'base64url');
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
      return plain;
    } catch {
      return null;
    }
  }
}
