import { z } from 'zod';

const optionalNonEmpty = z.string().min(1).optional();

function applyCloudinaryUrlFallback(config: Record<string, unknown>): Record<string, unknown> {
  if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
    return config;
  }

  let rawUrl = typeof config.CLOUDINARY_URL === 'string' ? config.CLOUDINARY_URL : undefined;

  const legacyBundle = config.CLOUDINARY_API_ENVIRONMENT_VARIABLE;
  if (!rawUrl && typeof legacyBundle === 'string') {
    const start = legacyBundle.indexOf('cloudinary://');
    const alt = legacyBundle.indexOf('cloudinary:/');
    const from = start >= 0 ? start : alt >= 0 ? alt : -1;
    if (from >= 0) {
      rawUrl = legacyBundle.slice(from).trim();
    }
  }

  if (!rawUrl?.startsWith('cloudinary:/')) {
    return config;
  }

  try {
    const parsed = new URL(rawUrl.replace(/^cloudinary:\/\/?/, 'https://'));
    return {
      ...config,
      CLOUDINARY_API_KEY: config.CLOUDINARY_API_KEY ?? decodeURIComponent(parsed.username),
      CLOUDINARY_API_SECRET: config.CLOUDINARY_API_SECRET ?? decodeURIComponent(parsed.password),
      CLOUDINARY_CLOUD_NAME: config.CLOUDINARY_CLOUD_NAME ?? parsed.hostname,
    };
  } catch {
    return config;
  }
}

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
  CLOUDINARY_CLOUD_NAME: optionalNonEmpty,
  CLOUDINARY_API_KEY: optionalNonEmpty,
  CLOUDINARY_API_SECRET: optionalNonEmpty,
  CLOUDINARY_URL: optionalNonEmpty,
  /** 32-byte AES-256-GCM key, base64url-encoded (generate with crypto.randomBytes(32)). */
  BIODATA_MASTER_KEY: z.string().min(32),
  REST_COUNTRIES_API_URL: z.string().min(1).default('https://api.restcountries.com/countries/v5'),
  REST_COUNTRIES_API_KEY: z.string().min(1),
  DAILY_CHECKIN_POINTS: z.coerce.number().int().positive().default(10),
  INACTIVITY_LIMIT_DAYS: z.coerce.number().int().positive().default(30),
  /** Cron pattern for inactivity scan (BullMQ). Default: 03:00 UTC daily. */
  INACTIVITY_CRON: z.string().min(1).default('0 3 * * *'),
  /** Max days ahead a community post may be scheduled. */
  COMMUNITY_SCHEDULE_MAX_DAYS: z.coerce.number().int().positive().default(90),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const merged = applyCloudinaryUrlFallback({
    ...process.env,
    ...config,
  });
  const parsed = envSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
