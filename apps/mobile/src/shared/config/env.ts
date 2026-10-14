import Constants from 'expo-constants';

/** Typed access to build-time configuration. The only place that reads process.env / extra. */
export const env = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, ''),
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  appVariant: (Constants.expoConfig?.extra?.appVariant as string | undefined) ?? 'development',
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
} as const;
