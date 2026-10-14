import { AppText, Loader, VStack, useTheme } from '@housingcom/ui';
import { StyleSheet, View } from 'react-native';

/** Shown for the second it takes to apply a critical OTA update. */
export function UpdatingOverlay() {
  const { colors } = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.background }]}>
      <VStack gap="lg" align="center">
        <Loader />
        <AppText variant="heading">Updating…</AppText>
        <AppText color="textSecondary">Applying an important fix. This takes a moment.</AppText>
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
});
