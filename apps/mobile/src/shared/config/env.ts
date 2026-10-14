import Constants from 'expo-constants';

/** Typed access to build-time configuration. The only place that reads process.env / extra. */
export const env = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, ''),
  appVariant: (Constants.expoConfig?.extra?.appVariant as string | undefined) ?? 'development',
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
  /** Socket.IO server (chat): the API's origin. */
  socketUrl: (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(
    /^(https?:\/\/[^/]+).*$/,
    '$1',
  ),
  easProjectId:
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ??
    Constants.easConfig?.projectId,
} as const;
