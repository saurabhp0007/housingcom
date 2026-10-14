import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform((v) => v === 'true' || v === '1');

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined));

/** Single source of truth for environment variables. The app refuses to boot on invalid config. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('api'),
  PUBLIC_BASE_URL: z.url(),
  CORS_ORIGINS: z.string().default(''),

  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: bool,
  DB_LOGGING: bool,

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  FIREBASE_PROJECT_ID: optionalString,
  FIREBASE_CLIENT_EMAIL: optionalString,
  FIREBASE_PRIVATE_KEY: optionalString,

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  S3_BUCKET: optionalString,
  S3_REGION: z.string().default('ap-south-1'),
  S3_ENDPOINT: optionalString,
  STORAGE_PUBLIC_BASE_URL: optionalString,

  OTA_ADMIN_TOKEN: z.string().min(32),
  OTA_SIGNING_PRIVATE_KEY_PATH: optionalString,
  OTA_SIGNING_KEY_ID: z.string().default('main'),
  OTA_MAX_UPLOAD_MB: z.coerce.number().positive().default(100),
  OTA_AUTO_PAUSE_CRASH_RATE: z.coerce.number().min(0).max(1).default(0.2),
  OTA_AUTO_PAUSE_MIN_LAUNCHES: z.coerce.number().int().min(1).default(50),

  GEO_SERVICEABLE_RADIUS_KM: z.coerce.number().positive().default(15),
  /** Google Places API (New). Optional: without it, search uses our own areas only. */
  GOOGLE_PLACES_API_KEY: optionalString,

  THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema
    .superRefine((env, ctx) => {
      if (env.STORAGE_DRIVER === 's3' && !env.S3_BUCKET) {
        ctx.addIssue({
          code: 'custom',
          path: ['S3_BUCKET'],
          message: 'Required when STORAGE_DRIVER=s3',
        });
      }
    })
    .safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
