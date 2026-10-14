import { Pressable } from 'react-native';
import { AppText } from '../../primitives/AppText';
import { Card } from '../../primitives/Card';
import { VStack } from '../../primitives/Stack';

export interface StatTileProps {
  label: string;
  value: number | string;
  /** Highlights tiles that need attention (e.g. pending approvals). */
  emphasis?: boolean;
  onPress?: () => void;
}

/** KPI tile for dashboards. */
export function StatTile({ label, value, emphasis, onPress }: StatTileProps) {
  const body = (
    <Card tone={emphasis ? 'primary' : 'surface'} style={{ minHeight: 96 }}>
      <VStack gap="xs">
        <AppText variant="caption" color="textSecondary">
          {label}
        </AppText>
        <AppText variant="display" color={emphasis ? 'primary' : 'textPrimary'}>
          {String(value)}
        </AppText>
      </VStack>
    </Card>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {body}
    </Pressable>
  );
}
