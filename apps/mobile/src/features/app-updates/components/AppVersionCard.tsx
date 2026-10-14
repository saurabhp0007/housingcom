import { AppText, Button, VStack, useTheme, useToast } from '@housingcom/ui';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { env } from '@/shared/config/env';
import { otaService } from '../services/ota.service';

/** Profile section: build + OTA identifiers (handy for support) and a manual update check. */
export function AppVersionCard() {
  const { colors, radius, spacing } = useTheme();
  const toast = useToast();
  const [checking, setChecking] = useState(false);
  const info = otaService.info();

  const checkNow = async () => {
    setChecking(true);
    try {
      const result = await otaService.checkAndFetch();
      if (result.kind === 'ready') {
        toast.show({
          message: 'Update downloaded.',
          actionLabel: 'Restart',
          onAction: () => void otaService.apply(),
        });
      } else {
        toast.show("You're on the latest version.");
      }
    } catch {
      toast.show("Couldn't check for updates. Try again later.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      <VStack gap="xs">
        <AppText variant="bodyStrong">
          Version {env.appVersion} · {info.channel ?? env.appVariant}
        </AppText>
        <AppText variant="caption" color="textSecondary" selectable>
          {info.isEmbeddedLaunch
            ? 'Built-in bundle'
            : `Update ${info.updateId?.slice(0, 8) ?? '—'}`}
          {info.runtimeVersion ? ` · runtime ${info.runtimeVersion.slice(0, 10)}` : ''}
        </AppText>
      </VStack>
      {otaService.isEnabled ? (
        <Button
          label="Check for updates"
          variant="text"
          fullWidth={false}
          loading={checking}
          onPress={checkNow}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ card: { borderWidth: 1, gap: 8 } });
