import 'reflect-metadata';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ApiHttpExceptionFilter, TransformResponseInterceptor } from './common/http';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { Env } from './config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.use(helmet());
  app.setGlobalPrefix('v1', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });

  const corsOrigins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformResponseInterceptor(reflector, { naming: 'snake' }));
  app.useGlobalFilters(new ApiHttpExceptionFilter({ naming: 'snake' }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SoulSync Global API')
    .setDescription('Privacy-first multi-tenant matrimony marketplace API')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);
  console.log(`SoulSync API listening on http://localhost:${port} (docs: /docs)`);
}

bootstrap().catch((error: unknown) => {
  if (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'EADDRINUSE'
  ) {
    console.error(
      'Port is already in use. Stop the other process or change API_PORT in apps/api/.env.',
    );
    console.error('Windows: npx kill-port 4000');
  }
  console.error(error);
  process.exit(1);
});
