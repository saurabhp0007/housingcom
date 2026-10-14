import { AppText, Button, Screen, VStack, useToast } from '@housingcom/ui';
import { isVersionBelow } from '@housingcom/utils';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { env } from '@/shared/config/env';
import { useAppConfigQuery } from '../../app-config/app-config.api';

const platform = Platform.OS === 'ios' ? 'ios' : 'android';

/**
 * Native-binary versioning (things OTA cannot fix): blocks builds below the server's
 * minSupportedVersion, and nudges builds below latestVersion once per launch.
 */
export function ForceUpdateGate({ children }: PropsWithChildren) {
  const { data: config } = useAppConfigQuery(platform);
  const toast = useToast();
  const nudged = useRef(false);

  const mustUpdate = !!config && isVersionBelow(env.appVersion, config.minSupportedVersion);
  const canUpdate = !!config && isVersionBelow(env.appVersion, config.latestVersion);

  useEffect(() => {
    if (!config || mustUpdate || !canUpdate || nudged.current) return;
    nudged.current = true;
    toast.show({
      message: 'A new version of the app is available.',
      actionLabel: 'Update',
      onAction: () => void Linking.openURL(config.storeUrl),
    });
  }, [config, mustUpdate, canUpdate, toast]);

  if (mustUpdate && config) {
    return (
      <Screen
        footer={<Button label="Update now" onPress={() => void Linking.openURL(config.storeUrl)} />}
      >
        <VStack flex={1} justify="center" gap="md">
          <AppText variant="display">Time to update</AppText>
          <AppText color="textSecondary">
            This version is no longer supported. Update to keep finding rooms, flats and PGs near
            you.
          </AppText>
        </VStack>
      </Screen>
    );
  }

  return <>{children}</>;
}
