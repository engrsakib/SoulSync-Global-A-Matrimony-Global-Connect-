import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import type { Env } from '../config/env.schema';

@Injectable()
export class PasswordService {
  private readonly rounds: number;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.rounds = this.config.get('BCRYPT_ROUNDS', { infer: true });
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
