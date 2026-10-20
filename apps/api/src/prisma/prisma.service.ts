import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPrismaClient, type PrismaClient } from '@soulsync/db';
import type { Env } from '../config/env.schema';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.client = createPrismaClient(this.config.get('DATABASE_URL', { infer: true }));
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
