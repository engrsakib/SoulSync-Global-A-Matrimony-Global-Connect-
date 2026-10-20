import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redis: RedisService,
    private readonly health: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.health.check(key);
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        return indicator.down({ message: `Unexpected PING response: ${pong}` });
      }
      return indicator.up();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Redis unavailable';
      return indicator.down({ message });
    }
  }
}
