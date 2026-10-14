import { ListingSort } from '@housingcom/contracts';
import { Button, Sheet, VStack } from '@housingcom/ui';

export const SORT_LABELS: Record<ListingSort, string> = {
  recommended: 'Recommended',
  nearest: 'Nearest',
  newest: 'Newest',
  most_viewed: 'Most viewed',
};

interface SortSheetProps {
  visible: boolean;
  value: ListingSort;
  onChange: (sort: ListingSort) => void;
  onDismiss: () => void;
}

export function SortSheet({ visible, value, onChange, onDismiss }: SortSheetProps) {
  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Sort by">
      <VStack gap="sm">
        {Object.values(ListingSort).map((s) => (
          <Button
            key={s}
            label={SORT_LABELS[s]}
            variant={s === value ? 'primary' : 'tonal'}
            onPress={() => onChange(s)}
          />
        ))}
      </VStack>
    </Sheet>
  );
}
