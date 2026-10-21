import { z } from 'zod';

const optionalNonEmpty = z.string().min(1).optional();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
  DEFAULT_AUTH_TENANT_SLUG: z.string().min(1).default('demo'),
  LOGIN_CODE_PEPPER: z.string().min(16).optional(),
  SMTP_HOST: optionalNonEmpty,
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  SMTP_USER: optionalNonEmpty,
  SMTP_PASS: optionalNonEmpty,
  SMTP_FROM: optionalNonEmpty,
  APP_PUBLIC_NAME: z.string().min(1).default('SoulSync Global'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
