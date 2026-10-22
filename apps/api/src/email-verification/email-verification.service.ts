import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { Env } from '../config/env.schema';
import { RedisService } from '../redis/redis.service';

const OTP_TTL_SECONDS = 300;
const CHANGE_CURRENT_TTL_SECONDS = 900;
const SEND_WINDOW_SECONDS = 900;
const MAX_SENDS_PER_WINDOW = 3;
const MAX_VERIFY_ATTEMPTS = 5;

type OtpPurpose = 'set' | 'change-current' | 'change-new';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private async ensureRedis(): Promise<void> {
    if (this.redis.client.status === 'wait') {
      await this.redis.client.connect();
    }
  }

  private otpKey(purpose: OtpPurpose, userId: string, emailNorm?: string): string {
    if (emailNorm) {
      return `email-otp:${purpose}:${userId}:${emailNorm}`;
    }
    return `email-otp:${purpose}:${userId}`;
  }

  private sendRateKey(userId: string): string {
    return `email-otp:send-count:${userId}`;
  }

  private changeCurrentVerifiedKey(userId: string): string {
    return `email-change:${userId}:current`;
  }

  private passwordResetOtpKey(tenantId: string, emailNorm: string): string {
    return `email-otp:password-reset:${tenantId}:${emailNorm}`;
  }

  private passwordResetSendRateKey(tenantId: string, emailNorm: string): string {
    return `email-otp:send-count:password-reset:${tenantId}:${emailNorm}`;
  }

  private passwordResetVerifiedKey(tenantId: string, emailNorm: string): string {
    return `password-reset:${tenantId}:${emailNorm}`;
  }

  private hashCode(code: string): string {
    const secret = this.config.get('JWT_ACCESS_SECRET', { infer: true });
    return createHmac('sha256', secret).update(code).digest('hex');
  }

  private verifyCode(code: string, storedHash: string): boolean {
    const expected = this.hashCode(code);
    if (expected.length !== storedHash.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expected), Buffer.from(storedHash));
  }

  generateCode(): string {
    return String(randomInt(100_000, 1_000_000));
  }

  private async enforceSendRateLimitForKey(rateKey: string): Promise<void> {
    await this.ensureRedis();
    const count = await this.redis.client.incr(rateKey);
    if (count === 1) {
      await this.redis.client.expire(rateKey, SEND_WINDOW_SECONDS);
    }
    if (count > MAX_SENDS_PER_WINDOW) {
      throw new HttpException(
        'Too many verification emails sent. Please wait before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async enforceSendRateLimit(userId: string): Promise<void> {
    await this.enforceSendRateLimitForKey(this.sendRateKey(userId));
  }

  private async enforceSendRateLimitByEmail(tenantId: string, emailNorm: string): Promise<void> {
    await this.enforceSendRateLimitForKey(this.passwordResetSendRateKey(tenantId, emailNorm));
  }

  async storeOtp(
    purpose: OtpPurpose,
    userId: string,
    code: string,
    emailNorm?: string,
  ): Promise<void> {
    await this.ensureRedis();
    await this.enforceSendRateLimit(userId);
    const key = this.otpKey(purpose, userId, emailNorm);
    await this.redis.client.set(
      key,
      JSON.stringify({ hash: this.hashCode(code), attempts: 0 }),
      'EX',
      OTP_TTL_SECONDS,
    );
  }

  private async verifyOtpAtKey(key: string, code: string): Promise<void> {
    await this.ensureRedis();
    const raw = await this.redis.client.get(key);
    if (!raw) {
      throw new BadRequestException('Verification code expired or invalid. Request a new code.');
    }

    const parsed = JSON.parse(raw) as { hash: string; attempts: number };
    if (parsed.attempts >= MAX_VERIFY_ATTEMPTS) {
      await this.redis.client.del(key);
      throw new BadRequestException('Too many incorrect attempts. Request a new code.');
    }

    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      throw new BadRequestException('Enter the 6-digit verification code.');
    }

    if (!this.verifyCode(digits, parsed.hash)) {
      parsed.attempts += 1;
      const ttl = await this.redis.client.ttl(key);
      if (ttl > 0) {
        await this.redis.client.set(key, JSON.stringify(parsed), 'EX', ttl);
      }
      throw new BadRequestException('Incorrect verification code.');
    }

    await this.redis.client.del(key);
  }

  async verifyOtp(
    purpose: OtpPurpose,
    userId: string,
    code: string,
    emailNorm?: string,
  ): Promise<void> {
    const key = this.otpKey(purpose, userId, emailNorm);
    await this.verifyOtpAtKey(key, code);
  }

  async storePasswordResetOtp(
    tenantId: string,
    emailNorm: string,
    code: string,
  ): Promise<void> {
    await this.ensureRedis();
    await this.enforceSendRateLimitByEmail(tenantId, emailNorm);
    const key = this.passwordResetOtpKey(tenantId, emailNorm);
    await this.redis.client.set(
      key,
      JSON.stringify({ hash: this.hashCode(code), attempts: 0 }),
      'EX',
      OTP_TTL_SECONDS,
    );
  }

  async verifyPasswordResetOtp(
    tenantId: string,
    emailNorm: string,
    code: string,
  ): Promise<void> {
    const key = this.passwordResetOtpKey(tenantId, emailNorm);
    await this.verifyOtpAtKey(key, code);
  }

  async markPasswordResetVerified(tenantId: string, emailNorm: string): Promise<void> {
    await this.ensureRedis();
    await this.redis.client.set(
      this.passwordResetVerifiedKey(tenantId, emailNorm),
      '1',
      'EX',
      CHANGE_CURRENT_TTL_SECONDS,
    );
  }

  async assertPasswordResetVerified(tenantId: string, emailNorm: string): Promise<void> {
    await this.ensureRedis();
    const ok = await this.redis.client.get(this.passwordResetVerifiedKey(tenantId, emailNorm));
    if (!ok) {
      throw new BadRequestException('Verify your email with the code before setting a new password.');
    }
  }

  async clearPasswordResetVerified(tenantId: string, emailNorm: string): Promise<void> {
    await this.redis.client.del(this.passwordResetVerifiedKey(tenantId, emailNorm));
  }

  async markChangeCurrentVerified(userId: string): Promise<void> {
    await this.ensureRedis();
    await this.redis.client.set(
      this.changeCurrentVerifiedKey(userId),
      '1',
      'EX',
      CHANGE_CURRENT_TTL_SECONDS,
    );
  }

  async assertChangeCurrentVerified(userId: string): Promise<void> {
    await this.ensureRedis();
    const ok = await this.redis.client.get(this.changeCurrentVerifiedKey(userId));
    if (!ok) {
      throw new BadRequestException('Verify your current email before entering a new address.');
    }
  }

  async clearChangeCurrentVerified(userId: string): Promise<void> {
    await this.redis.client.del(this.changeCurrentVerifiedKey(userId));
  }
}
