import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadApiEnvFile, resolveApiEnvFilePaths } from './load-api-env';
import { validateEnv } from './env.schema';

loadApiEnvFile();

const envFilePaths = resolveApiEnvFilePaths();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths.length > 0 ? envFilePaths : undefined,
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
