import { existsSync } from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';
import { version as VERSION } from './package.json';

/**
 * All environment-specific values come from env vars (EXPO_PUBLIC_* are inlined into JS;
 * the rest only affect native config). See .env.
 */
const APP_VARIANT = (process.env.APP_VARIANT ?? 'development') as
  'development' | 'preview' | 'production';
const IS_PROD = APP_VARIANT === 'production';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';
/** Self-hosted Expo Updates server (apps/api → OtaModule). */
const UPDATES_URL = process.env.UPDATES_URL ?? `${API_URL}/ota/manifest`;
/** The OTA channel is baked into each binary; the server serves updates per channel. */
const UPDATE_CHANNEL = process.env.UPDATE_CHANNEL ?? APP_VARIANT;

/** Public certificate for OTA code signing (generate with `npx expo-updates codesigning:generate`). */
const OTA_CERT_PATH = './certs/certificate.pem';
const OTA_SIGNING_ENABLED = existsSync(OTA_CERT_PATH);

/** package.json is the only place the version lives; build.sh bumps it. 1.2.3 → versionCode 10203. */
const [MAJOR = 0, MINOR = 0, PATCH = 0] = VERSION.split('.').map(Number);
const VERSION_CODE = MAJOR * 10_000 + MINOR * 100 + PATCH;

const BUNDLE_ID = IS_PROD ? 'com.quantumtech.housing' : `com.quantumtech.housing.${APP_VARIANT}`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PROD ? 'Housing' : `Housing (${APP_VARIANT})`,
  slug: 'housing',
  // Native app only; the PRD excludes a website / web version.
  platforms: ['ios', 'android'],
  scheme: 'housing',
  version: VERSION,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',

  // Fingerprint of all native code/config. Any native change => new runtime version =>
  // OTA updates can never reach a binary they are not compatible with.
  runtimeVersion: { policy: 'fingerprint' },
  updates: {
    url: UPDATES_URL,
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    // Launch immediately with the cached bundle; new updates apply on next launch
    // (critical ones are applied right away by useOtaUpdates).
    fallbackToCacheTimeout: 0,
    requestHeaders: { 'expo-channel-name': UPDATE_CHANNEL },
    // When the certificate exists, the app rejects any update not signed by our private key.
    ...(OTA_SIGNING_ENABLED
      ? {
          codeSigningCertificate: OTA_CERT_PATH,
          codeSigningMetadata: { keyid: 'main', alg: 'rsa-v1_5-sha256' },
        }
      : {}),
  },

  ios: {
    bundleIdentifier: BUNDLE_ID,
    buildNumber: String(VERSION_CODE),
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'We use your location to show rooms, flats and PGs near you.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
    versionCode: VERSION_CODE,
    predictiveBackGestureEnabled: true,
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    adaptiveIcon: {
      backgroundColor: '#4F46E5',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },

  plugins: [
    'expo-router',
    'expo-updates',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/icon.png',
        imageWidth: 120,
        backgroundColor: '#FFFFFF',
        dark: { backgroundColor: '#0E0E16' },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'We use your location to show rooms, flats and PGs near you.',
      },
    ],
    ['expo-notifications', { color: '#4F46E5' }],
    [
      'expo-image-picker',
      {
        photosPermission: 'Choose photos of your property to add to your listing.',
        cameraPermission: 'Take photos of your property and your verification documents.',
      },
    ],
    'expo-video',
  ],

  experiments: { typedRoutes: true },
  extra: {
    appVariant: APP_VARIANT,
    updateChannel: UPDATE_CHANNEL,
    // Expo push tokens are scoped to the EAS project.
    ...(process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {}),
  },
});
