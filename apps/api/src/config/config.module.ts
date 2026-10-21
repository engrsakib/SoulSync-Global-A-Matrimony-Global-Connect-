import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadApiEnvFile, resolveApiEnvFilePath } from './load-api-env';
import { validateEnv } from './env.schema';

loadApiEnvFile();

const apiEnvFile = resolveApiEnvFilePath();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: apiEnvFile ? [apiEnvFile] : [],
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
