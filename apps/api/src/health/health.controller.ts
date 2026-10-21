import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { ApiCommonErrors, ApiErrorEnvelopeDto } from '../common/swagger';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Full health check (database + Redis)',
    description:
      'Success response is **raw** Terminus JSON (not wrapped in the standard API envelope).',
  })
  @ApiResponse({
    status: 200,
    description: 'Terminus health check result (unwrapped)',
    schema: {
      type: 'object',
      example: {
        status: 'ok',
        info: { database: { status: 'up' }, redis: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' }, redis: { status: 'up' } },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Dependency unhealthy', type: ApiErrorEnvelopeDto })
  @ApiCommonErrors()
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Returns plain `{ status: "ok" }` without the API success envelope.',
  })
  @ApiResponse({
    status: 200,
    schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } },
  })
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe (database + Redis)',
    description: 'Success response is raw Terminus JSON (not enveloped).',
  })
  @ApiResponse({
    status: 200,
    description: 'Terminus readiness result (unwrapped)',
    schema: {
      type: 'object',
      example: {
        status: 'ok',
        info: { database: { status: 'up' }, redis: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' }, redis: { status: 'up' } },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Not ready', type: ApiErrorEnvelopeDto })
  ready() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
