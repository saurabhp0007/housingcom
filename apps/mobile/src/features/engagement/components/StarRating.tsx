import { HStack, useTheme, Icon } from '@housingcom/ui';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

interface StarRatingProps {
  value: number;
  size?: number;
  /** Makes the stars tappable. */
  onChange?: (value: number) => void;
}

export function StarRating({ value, size = 16, onChange }: StarRatingProps) {
  const { colors } = useTheme();
  return (
    <HStack gap="xxs" align="center">
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Icon
            name={n <= Math.round(value) ? 'star' : 'star-outline'}
            size={size}
            color={n <= Math.round(value) ? colors.warning : colors.textSecondary}
          />
        );
        return onChange ? (
          <Pressable
            key={n}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(n);
            }}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={n}>{icon}</View>
        );
      })}
    </HStack>
  );
}
