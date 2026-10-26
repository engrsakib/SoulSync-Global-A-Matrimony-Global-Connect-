import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import type { Env } from '../config/env.schema';
import type { JwtPayload, RefreshJwtPayload, SocketJwtPayload } from './auth.types';

@Injectable()
export class JwtTokenService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  signAccess(payload: JwtPayload): string {
    const secret = this.config.get('JWT_ACCESS_SECRET', { infer: true });
    const expiresIn = this.config.get('JWT_ACCESS_TTL', { infer: true });
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  verifyAccess(token: string): JwtPayload {
    const secret = this.config.get('JWT_ACCESS_SECRET', { infer: true });
    const payload = jwt.verify(token, secret) as JwtPayload & { typ?: string };
    if (payload.typ === 'refresh' || payload.typ === 'socket') {
      throw new UnauthorizedException('Invalid access token');
    }
    return payload;
  }

  signRefresh(payload: JwtPayload): string {
    const secret = this.config.get('JWT_REFRESH_SECRET', { infer: true });
    const expiresIn = this.config.get('JWT_REFRESH_TTL', { infer: true });
    const refreshPayload: RefreshJwtPayload = { ...payload, typ: 'refresh' };
    return jwt.sign(refreshPayload, secret, { expiresIn } as jwt.SignOptions);
  }

  verifyRefresh(token: string): RefreshJwtPayload {
    const secret = this.config.get('JWT_REFRESH_SECRET', { infer: true });
    const payload = jwt.verify(token, secret) as RefreshJwtPayload;
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return payload;
  }

  signSocket(payload: JwtPayload): string {
    const secret = this.config.get('JWT_ACCESS_SECRET', { infer: true });
    const socketPayload: SocketJwtPayload = { ...payload, typ: 'socket' };
    return jwt.sign(socketPayload, secret, { expiresIn: '2m' } as jwt.SignOptions);
  }

  verifySocket(token: string): SocketJwtPayload {
    const secret = this.config.get('JWT_ACCESS_SECRET', { infer: true });
    const payload = jwt.verify(token, secret) as SocketJwtPayload;
    if (payload.typ !== 'socket') {
      throw new UnauthorizedException('Invalid socket ticket');
    }
    return payload;
  }

  /** @deprecated Use signAccess */
  sign(payload: JwtPayload): string {
    return this.signAccess(payload);
  }

  /** @deprecated Use verifyAccess */
  verify(token: string): JwtPayload {
    return this.verifyAccess(token);
  }
}
