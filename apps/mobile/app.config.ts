import { existsSync } from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * All environment-specific values come from env vars (EXPO_PUBLIC_* are inlined into JS;
 * the rest only affect native config). See .env.example.
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

const BUNDLE_ID = IS_PROD ? 'com.quantumtech.housing' : `com.quantumtech.housing.${APP_VARIANT}`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PROD ? 'Housing' : `Housing (${APP_VARIANT})`,
  slug: 'housing',
  // Native app only; the PRD excludes a website / web version.
  platforms: ['ios', 'android'],
  scheme: 'housing',
  version: '1.0.0',
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
    supportsTablet: false,
    usesAppleSignIn: true,
    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './firebase/GoogleService-Info.plist',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'We use your location to show rooms, flats and PGs near you.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
    predictiveBackGestureEnabled: true,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './firebase/google-services.json',
    config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY } },
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
    'expo-apple-authentication',
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
    // Google Maps on Android, Apple Maps on iOS (no Google key needed on iOS).
    [
      'expo-maps',
      {
        requestLocationPermission: true,
        locationPermission: 'We use your location to show places near you.',
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.placeholder',
      },
    ],
    // React Native Firebase on iOS needs static frameworks.
    ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
  ],

  experiments: { typedRoutes: true },
  extra: {
    appVariant: APP_VARIANT,
    updateChannel: UPDATE_CHANNEL,
  },
});
