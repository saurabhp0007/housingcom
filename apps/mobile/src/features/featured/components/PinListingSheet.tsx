import { FEATURE_DURATION_PRESETS } from '@housingcom/contracts';
import { AppText, Button, Chip, HStack, Sheet, Toggle, VStack, useToast } from '@housingcom/ui';
import { useState } from 'react';
import { toAppError } from '@/shared/api/api-error';
import { usePinListingMutation } from '../featured.api';

interface Props {
  listingId: string;
  visible: boolean;
  onDismiss: () => void;
}

/** Admin: feature a listing for free, optionally pinned above the rotation in its area. */
export function PinListingSheet({ listingId, visible, onDismiss }: Props) {
  const toast = useToast();
  const [days, setDays] = useState<number>(FEATURE_DURATION_PRESETS[0]);
  const [pinned, setPinned] = useState(true);
  const [pin, { isLoading }] = usePinListingMutation();

  const submit = async () => {
    try {
      await pin({ listingId, body: { durationDays: days, pinned } }).unwrap();
      onDismiss();
      toast.show({ message: pinned ? `Pinned for ${days} days` : `Featured for ${days} days` });
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Feature this listing">
      <VStack gap="md">
        <AppText color="textSecondary">
          No payment is taken. If the listing is already featured, the days are added.
        </AppText>
        <HStack gap="xs" wrap>
          {FEATURE_DURATION_PRESETS.map((d) => (
            <Chip key={d} label={`${d} days`} selected={days === d} onPress={() => setDays(d)} />
          ))}
        </HStack>
        <Toggle label="Pin first in its area" value={pinned} onValueChange={setPinned} />
        <Button label="Feature listing" loading={isLoading} onPress={() => void submit()} />
      </VStack>
    </Sheet>
  );
}
