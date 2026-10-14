import { FilterChip, Text } from '@expo/ui/jetpack-compose';
import { testID as testIdModifier } from '@expo/ui/jetpack-compose/modifiers';
import * as Haptics from 'expo-haptics';
import { NativeHost } from '../../native/NativeHost';
import type { ChipProps } from './types';

/** Material 3 FilterChip (filters: type, sharing, gender, amenities). */
export function Chip({ label, selected = false, onPress, disabled, testID }: ChipProps) {
  return (
    <NativeHost>
      <FilterChip
        selected={selected}
        enabled={!disabled}
        onClick={() => {
          void Haptics.selectionAsync();
          onPress?.();
        }}
        modifiers={testID ? [testIdModifier(testID)] : undefined}
      >
        <FilterChip.Label>
          <Text>{label}</Text>
        </FilterChip.Label>
      </FilterChip>
    </NativeHost>
  );
}
