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
  /** Phone sign-in code accepted for every number (no SMS provider yet). */
  OTP_STATIC_CODE: z.string().regex(/^\d{6}$/),

  /** Uploaded media, documents and OTA assets live on this disk path. */
  STORAGE_LOCAL_DIR: z.string().default('./storage'),

  OTA_ADMIN_TOKEN: z.string().min(32),
  OTA_SIGNING_PRIVATE_KEY_PATH: optionalString,
  OTA_SIGNING_KEY_ID: z.string().default('main'),
  OTA_MAX_UPLOAD_MB: z.coerce.number().positive().default(100),
  OTA_AUTO_PAUSE_CRASH_RATE: z.coerce.number().min(0).max(1).default(0.2),
  OTA_AUTO_PAUSE_MIN_LAUNCHES: z.coerce.number().int().min(1).default(50),

  GEO_SERVICEABLE_RADIUS_KM: z.coerce.number().positive().default(15),
  /** Google Places API (New). Optional: without it, search uses our own areas only. */
  GOOGLE_PLACES_API_KEY: optionalString,

  /** Expo push. The access token is only needed when "enhanced push security" is on in Expo. */
  PUSH_ENABLED: z
    .enum(['true', 'false', '1', '0'])
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
  EXPO_ACCESS_TOKEN: optionalString,

  /** `razorpay` charges for real (test or live keys); `fake` simulates checkout in the app. */
  PAYMENTS_DRIVER: z.enum(['razorpay', 'fake']).default('razorpay'),
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  /** Shown on the payment sheet. */
  PAYMENTS_BUSINESS_NAME: z.string().default('Housing'),

  THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema
    .superRefine((env, ctx) => {
      if (env.PAYMENTS_DRIVER === 'razorpay' && env.NODE_ENV === 'production') {
        for (const key of [
          'RAZORPAY_KEY_ID',
          'RAZORPAY_KEY_SECRET',
          'RAZORPAY_WEBHOOK_SECRET',
        ] as const) {
          if (!env[key])
            ctx.addIssue({ code: 'custom', path: [key], message: 'Required in production' });
        }
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
