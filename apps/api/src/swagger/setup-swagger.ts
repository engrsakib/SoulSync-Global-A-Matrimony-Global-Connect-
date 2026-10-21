import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_EXTRA_MODELS } from '../common/swagger';

const API_DESCRIPTION = `
SoulSync Global REST API.

## Base path
Most routes live under the global prefix **\`/v1\`** (e.g. \`/v1/auth/login\`).

## Success envelope
Unless noted otherwise, **\`/v1/*\`** success responses use snake_case metadata and a \`data\` payload:

\`\`\`json
{
  "success": true,
  "status_code": 200,
  "message": "Success",
  "data": {},
  "request_id": "...",
  "timestamp": "..."
}
\`\`\`

## Exceptions
**\`/v1/health/**\`** success responses return **raw** Terminus / liveness JSON (not wrapped). Errors still use the standard error envelope.

## Authentication
Account routes require \`Authorization: Bearer <JWT>\` from login, register, or guest flows.
`.trim();

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('SoulSync Global API')
    .setDescription(API_DESCRIPTION)
    .setVersion('1.0.0')
    .addServer('/v1', 'Versioned API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from auth endpoints',
      },
      'jwt',
    )
    .addTag('auth', 'Registration, login, and guest access')
    .addTag('account', 'Authenticated profile and credentials (JWT required)')
    .addTag('email', 'Set or change email with SMTP verification codes (JWT required)')
    .addTag('media', 'Authenticated file uploads to Cloudinary (JWT required)')
    .addTag('biodata', 'Encrypted matrimony biodata for the authenticated user (JWT required)')
    .addTag('partner-preferences', 'Partner preference profile (dev: X-User-Id header)')
    .addTag('tenants', 'Active tenants')
    .addTag('stats', 'Public platform aggregates')
    .addTag('health', 'Liveness and readiness (success bodies not enveloped)')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [...SWAGGER_EXTRA_MODELS],
  });

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });
}
