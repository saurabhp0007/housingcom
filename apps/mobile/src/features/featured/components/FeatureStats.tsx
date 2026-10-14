import type { ListingFeatureResponse } from '@housingcom/contracts';
import { HStack, StatTile } from '@housingcom/ui';
import { View } from 'react-native';

/** Impressions, views and leads during the featured period. */
export function FeatureStats({ feature }: { feature: ListingFeatureResponse }) {
  return (
    <HStack gap="sm">
      {[
        { label: 'Impressions', value: feature.impressions },
        { label: 'Views', value: feature.views },
        { label: 'Leads', value: feature.leads },
      ].map((s) => (
        <View key={s.label} style={{ flex: 1 }}>
          <StatTile label={s.label} value={s.value} />
        </View>
      ))}
    </HStack>
  );
}
