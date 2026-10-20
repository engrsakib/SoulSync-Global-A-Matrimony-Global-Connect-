import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import type { Env } from '../config/env.schema';
import type { JwtPayload } from './auth.types';

@Injectable()
export class JwtTokenService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  sign(payload: JwtPayload): string {
    const secret = this.config.get('JWT_SECRET', { infer: true });
    const expiresIn = this.config.get('JWT_ACCESS_TTL', { infer: true });
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    const secret = this.config.get('JWT_SECRET', { infer: true });
    return jwt.verify(token, secret) as JwtPayload;
  }
}
