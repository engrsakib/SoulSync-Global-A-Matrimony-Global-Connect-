import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import type { Env } from '../config/env.schema';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import type { Prisma } from '@soulsync/db';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { ActivityLogRequestContext } from '../activity-log/activity-log.context';
import type { JwtPayload } from './auth.types';
import {
  isAuthSessionRowActive,
  parseJwtTtlSeconds,
  SESSION_CACHE_ACTIVE,
  SESSION_CACHE_INACTIVE,
  sessionCacheTtlSeconds,
  sessionValidityCacheKey,
} from './auth-session-access.util';
import { JwtTokenService } from './jwt.service';

export type SessionDevicePayload = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly config: ConfigService<Env, true>,
    private readonly fieldCrypto: FieldEncryptionService,
    private readonly redis: RedisService,
  ) {}

  private accessTtlSeconds(): number {
    return parseJwtTtlSeconds(this.config.get('JWT_ACCESS_TTL', { infer: true }));
  }

  private async writeSessionValidityCache(
    sessionId: string,
    active: boolean,
    sessionExpiresAt: Date,
  ): Promise<void> {
    const ttl = sessionCacheTtlSeconds(sessionExpiresAt, this.accessTtlSeconds());
    const key = sessionValidityCacheKey(sessionId);
    await this.redis.client.setex(key, ttl, active ? SESSION_CACHE_ACTIVE : SESSION_CACHE_INACTIVE);
  }

  async assertAccessSessionActive(sessionId: string, userId: string): Promise<void> {
    const key = sessionValidityCacheKey(sessionId);
    const cached = await this.redis.client.get(key);
    if (cached === SESSION_CACHE_INACTIVE) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    if (cached === SESSION_CACHE_ACTIVE) {
      return;
    }

    const session = await this.prisma.client.authSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, revokedAt: true, expiresAt: true },
    });
    const active = isAuthSessionRowActive(session, userId);
    const expiresAt = session?.expiresAt ?? new Date(Date.now() + 1000);
    await this.writeSessionValidityCache(sessionId, active, expiresAt);
    if (!active) {
      throw new UnauthorizedException('Session is no longer valid');
    }
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async createSession(
    user: { id: string; tenantId: string; role: string },
    ctx?: ActivityLogRequestContext,
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const sessionId = randomUUID();
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      sid: sessionId,
    };
    const refreshToken = this.jwtTokenService.signRefresh(payload);
    const accessToken = this.jwtTokenService.signAccess(payload);
    const expiresAt = this.refreshExpiresAt(refreshToken);
    const deviceEnc = this.fieldCrypto.encryptJson({
      ipAddress: ctx?.ipAddress ?? null,
      userAgent: ctx?.userAgent ?? null,
    });

    await this.prisma.client.authSession.create({
      data: {
        id: sessionId,
        tenantId: user.tenantId,
        userId: user.id,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
        payloadEnc: deviceEnc as Prisma.InputJsonValue,
      },
    });

    await this.writeSessionValidityCache(sessionId, true, expiresAt);

    return { accessToken, refreshToken, sessionId };
  }

  async rotateSession(
    refreshToken: string,
    ctx?: ActivityLogRequestContext,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string; tenantId: string; role: string }> {
    let payload: JwtPayload;
    try {
      payload = this.jwtTokenService.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const hash = this.hashRefreshToken(refreshToken);
    const now = new Date();

    if (payload.sid) {
      const session = await this.prisma.client.authSession.findUnique({
        where: { id: payload.sid },
      });
      if (
        !session ||
        session.userId !== payload.sub ||
        session.revokedAt ||
        session.expiresAt <= now ||
        session.refreshTokenHash !== hash
      ) {
        throw new UnauthorizedException('Session is no longer valid');
      }

      const nextPayload: JwtPayload = {
        sub: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role,
        sid: session.id,
      };
      const nextRefresh = this.jwtTokenService.signRefresh(nextPayload);
      const nextAccess = this.jwtTokenService.signAccess(nextPayload);
      const expiresAt = this.refreshExpiresAt(nextRefresh);

      await this.prisma.client.authSession.update({
        where: { id: session.id },
        data: {
          refreshTokenHash: this.hashRefreshToken(nextRefresh),
          lastSeenAt: now,
          expiresAt,
          payloadEnc: this.fieldCrypto.encryptJson({
            ipAddress: ctx?.ipAddress ?? null,
            userAgent: ctx?.userAgent ?? null,
          }) as Prisma.InputJsonValue,
        },
      });

      await this.writeSessionValidityCache(session.id, true, expiresAt);

      return {
        accessToken: nextAccess,
        refreshToken: nextRefresh,
        userId: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role,
      };
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, tenantId: true, role: true, deletedAt: true, status: true },
    });
    if (!user || user.deletedAt || user.status === 'DELETED') {
      throw new UnauthorizedException('User not found');
    }

    const created = await this.createSession(
      { id: user.id, tenantId: user.tenantId, role: user.role },
      ctx,
    );
    return {
      accessToken: created.accessToken,
      refreshToken: created.refreshToken,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };
  }

  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.prisma.client.authSession.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });
    if (!session) {
      return false;
    }
    await this.prisma.client.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    await this.writeSessionValidityCache(sessionId, false, session.expiresAt);
    return true;
  }

  async revokeByRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const payload = this.jwtTokenService.verifyRefresh(refreshToken);
      if (!payload.sid) {
        return false;
      }
      return this.revokeSession(payload.sid, payload.sub);
    } catch {
      return false;
    }
  }

  private refreshExpiresAt(refreshToken: string): Date {
    const decoded = jwt.decode(refreshToken) as { exp?: number } | null;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return new Date(Date.now() + 7 * 86_400_000);
  }
}
