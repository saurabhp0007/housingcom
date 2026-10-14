import type { Coordinates } from '@housingcom/contracts';
import { AppText, Button, Screen, TextField, VStack, useToast } from '@housingcom/ui';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useCreateAreaMutation, useCreateCityMutation } from '@/features/admin/admin.api';
import { LocationPicker } from '@/features/listings/components/LocationPicker';
import { toAppError } from '@/shared/api/api-error';

/** Admin modal: add a city, or an area inside a city (?cityId=…&cityName=…&lat=…&lng=…). */
export default function PlaceFormScreen() {
  const params = useLocalSearchParams<{
    cityId?: string;
    cityName?: string;
    lat?: string;
    lng?: string;
  }>();
  const isArea = !!params.cityId;
  const toast = useToast();
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [center, setCenter] = useState<Coordinates | null>(
    params.lat && params.lng ? { lat: Number(params.lat), lng: Number(params.lng) } : null,
  );
  const [createCity, cityState] = useCreateCityMutation();
  const [createArea, areaState] = useCreateAreaMutation();

  const save = async () => {
    if (!center || name.trim().length < 2 || (!isArea && state.trim().length < 2)) {
      return toast.show('Fill in the name and place the pin');
    }
    try {
      if (isArea)
        await createArea({
          cityId: params.cityId!,
          body: { name: name.trim(), ...center },
        }).unwrap();
      else await createCity({ name: name.trim(), state: state.trim(), ...center }).unwrap();
      toast.show('Saved');
      router.back();
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ title: isArea ? `New area · ${params.cityName ?? ''}` : 'New city' }}
      />
      <Screen
        scroll
        edges={['bottom']}
        footer={
          <Button
            label="Save"
            loading={cityState.isLoading || areaState.isLoading}
            onPress={() => void save()}
          />
        }
      >
        <VStack gap="lg" style={{ paddingTop: 16 }}>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
          />
          {!isArea ? (
            <TextField label="State" value={state} onChangeText={setState} autoCapitalize="words" />
          ) : null}
          <AppText variant="caption" color="textSecondary">
            Drag the map so the pin sits at the {isArea ? 'centre of the locality' : 'city centre'}.
          </AppText>
          <LocationPicker value={center} onChange={setCenter} showServiceability={false} />
        </VStack>
      </Screen>
    </>
  );
}
