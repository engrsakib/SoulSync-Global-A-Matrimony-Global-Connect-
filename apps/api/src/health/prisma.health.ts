import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly health: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.health.check(key);
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return indicator.up();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Database unavailable';
      return indicator.down({ message });
    }
  }
}
