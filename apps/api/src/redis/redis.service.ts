import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Env } from '../config/env.schema';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.client = new Redis(this.config.get('REDIS_URL', { infer: true }), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async ping(): Promise<string> {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
    return this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
