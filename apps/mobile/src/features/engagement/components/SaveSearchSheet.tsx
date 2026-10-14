import type { ListingFilters } from '@housingcom/contracts';
import { AppText, Button, Sheet, TextField, Toggle, VStack, useToast } from '@housingcom/ui';
import { useState } from 'react';
import type { SearchCenter } from '@/features/search/search.slice';
import { toAppError } from '@/shared/api/api-error';
import { useCreateSavedSearchMutation } from '../engagement.api';

/** Matches the search screen's fixed radius. */
const RADIUS_KM = 10;

interface SaveSearchSheetProps {
  center: SearchCenter;
  filters: ListingFilters;
  visible: boolean;
  onDismiss: () => void;
}

export function SaveSearchSheet({ center, filters, visible, onDismiss }: SaveSearchSheetProps) {
  const toast = useToast();
  // Mounted per open (see search screen), so initial state is always fresh.
  const [label, setLabel] = useState(center.label.slice(0, 80));
  const [alerts, setAlerts] = useState(true);
  const [create, { isLoading }] = useCreateSavedSearchMutation();

  const save = async () => {
    try {
      await create({
        label: label.trim(),
        lat: center.coords.lat,
        lng: center.coords.lng,
        radiusKm: RADIUS_KM,
        filters,
        alertsEnabled: alerts,
      }).unwrap();
      onDismiss();
      toast.show({
        message: alerts ? "Saved. We'll alert you about new matches." : 'Search saved.',
      });
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Save this search">
      <VStack gap="md">
        <TextField label="Name" value={label} onChangeText={setLabel} maxLength={80} />
        <Toggle label="Alert me when new places match" value={alerts} onValueChange={setAlerts} />
        <AppText variant="caption" color="textSecondary">
          Within {RADIUS_KM} km of {center.label}, with your current filters.
        </AppText>
        <Button
          label="Save search"
          disabled={label.trim().length < 2}
          loading={isLoading}
          onPress={() => void save()}
        />
      </VStack>
    </Sheet>
  );
}
