import { registerAs } from '@nestjs/config';
import { validateEnv } from './env.schema.js';

/**
 * Typed, namespaced config. Services inject only the slice they need:
 *   constructor(@Inject(otaConfig.KEY) private readonly config: ConfigType<typeof otaConfig>)
 * Nothing in the codebase reads process.env directly except this file.
 */
const env = () => validateEnv(process.env);

export const appConfig = registerAs('app', () => {
  const e = env();
  return {
    env: e.NODE_ENV,
    isProduction: e.NODE_ENV === 'production',
    port: e.PORT,
    apiPrefix: e.API_PREFIX,
    publicBaseUrl: e.PUBLIC_BASE_URL.replace(/\/$/, ''),
    corsOrigins: e.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    throttle: { ttlMs: e.THROTTLE_TTL_SECONDS * 1000, limit: e.THROTTLE_LIMIT },
  };
});

export const databaseConfig = registerAs('database', () => {
  const e = env();
  return {
    host: e.DB_HOST,
    port: e.DB_PORT,
    username: e.DB_USER,
    password: e.DB_PASSWORD,
    database: e.DB_NAME,
    ssl: e.DB_SSL,
    logging: e.DB_LOGGING,
  };
});

export const redisConfig = registerAs('redis', () => ({ url: env().REDIS_URL }));

export const authConfig = registerAs('auth', () => {
  const e = env();
  return {
    accessTokenSecret: e.JWT_ACCESS_SECRET,
    accessTokenTtlSeconds: e.JWT_ACCESS_TTL_SECONDS,
    refreshTokenTtlDays: e.REFRESH_TOKEN_TTL_DAYS,
    staticOtp: e.OTP_STATIC_CODE,
  };
});

export const storageConfig = registerAs('storage', () => ({ localDir: env().STORAGE_LOCAL_DIR }));

export const otaConfig = registerAs('ota', () => {
  const e = env();
  return {
    adminToken: e.OTA_ADMIN_TOKEN,
    signingPrivateKeyPath: e.OTA_SIGNING_PRIVATE_KEY_PATH,
    signingKeyId: e.OTA_SIGNING_KEY_ID,
    maxUploadBytes: Math.round(e.OTA_MAX_UPLOAD_MB * 1024 * 1024),
    autoPause: {
      crashRate: e.OTA_AUTO_PAUSE_CRASH_RATE,
      minLaunches: e.OTA_AUTO_PAUSE_MIN_LAUNCHES,
    },
  };
});

export const geoConfig = registerAs('geo', () => {
  const e = env();
  return {
    serviceableRadiusKm: e.GEO_SERVICEABLE_RADIUS_KM,
    googlePlacesApiKey: e.GOOGLE_PLACES_API_KEY,
  };
});

export const notificationsConfig = registerAs('notifications', () => {
  const e = env();
  return { pushEnabled: e.PUSH_ENABLED, expoAccessToken: e.EXPO_ACCESS_TOKEN };
});

export const paymentsConfig = registerAs('payments', () => {
  const e = env();
  return {
    driver: e.PAYMENTS_DRIVER,
    businessName: e.PAYMENTS_BUSINESS_NAME,
    razorpay: {
      keyId: e.RAZORPAY_KEY_ID,
      keySecret: e.RAZORPAY_KEY_SECRET,
      webhookSecret: e.RAZORPAY_WEBHOOK_SECRET,
    },
  };
});

export const allConfigs = [
  appConfig,
  databaseConfig,
  redisConfig,
  authConfig,
  storageConfig,
  otaConfig,
  geoConfig,
  notificationsConfig,
  paymentsConfig,
];
