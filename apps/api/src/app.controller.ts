import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'SoulSync Global API',
      version: '1.0.0',
      documentation: '/docs',
      health: '/v1/health',
      healthReady: '/v1/health/ready',
    };
  }
}
