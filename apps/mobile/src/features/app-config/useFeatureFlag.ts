import { Platform } from 'react-native';
import { useAppConfigQuery } from './app-config.api';

const platform = Platform.OS === 'ios' ? 'ios' : 'android';

/** Server-driven feature flags: features can be switched off without any app update. */
export function useFeatureFlag(name: string, fallback = false): boolean {
  const { data } = useAppConfigQuery(platform);
  return data?.featureFlags[name] ?? fallback;
}
