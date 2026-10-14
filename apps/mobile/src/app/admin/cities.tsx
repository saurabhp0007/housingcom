import {
  AppText,
  Button,
  Card,
  EmptyState,
  HStack,
  Pill,
  Screen,
  Toggle,
  VStack,
  useToast,
} from '@housingcom/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';
import {
  useAdminAreasQuery,
  useAdminCitiesQuery,
  useUpdateAreaMutation,
  useUpdateCityMutation,
  type AdminCity,
} from '@/features/admin/admin.api';
import { toAppError } from '@/shared/api/api-error';

/** Manage service cities and their areas; areas drive "near me", search and listing placement. */
export default function CitiesScreen() {
  const toast = useToast();
  const { data: cities } = useAdminCitiesQuery();
  const [city, setCity] = useState<AdminCity | null>(null);
  const { data: areas } = useAdminAreasQuery(city?.id ?? '', { skip: !city });
  const [updateCity] = useUpdateCityMutation();
  const [updateArea] = useUpdateAreaMutation();

  const toggle = async (work: Promise<unknown>) => {
    try {
      await work;
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  return (
    <Screen scroll edges={['bottom']}>
      <VStack gap="md" style={{ paddingTop: 16 }}>
        {city ? (
          <>
            <HStack justify="space-between" align="center">
              <AppText variant="title">{city.name}</AppText>
              <Button
                label="All cities"
                variant="text"
                fullWidth={false}
                onPress={() => setCity(null)}
              />
            </HStack>
            <Toggle
              label="City is live in the app"
              value={city.isActive}
              onValueChange={(isActive) => {
                setCity({ ...city, isActive });
                void toggle(updateCity({ id: city.id, body: { isActive } }).unwrap());
              }}
            />
            <Button
              label="Add area"
              variant="tonal"
              onPress={() =>
                router.push({
                  pathname: '/place-form',
                  params: {
                    cityId: city.id,
                    cityName: city.name,
                    lat: String(city.center.lat),
                    lng: String(city.center.lng),
                  },
                })
              }
            />
            {(areas ?? []).map((a) => (
              <Card key={a.id} padding="md">
                <VStack gap="sm">
                  <HStack justify="space-between" align="center">
                    <AppText variant="bodyStrong">{a.name}</AppText>
                    {!a.isActive ? <Pill label="Hidden" /> : null}
                  </HStack>
                  <Toggle
                    label="Popular (quick-pick chip)"
                    value={a.isPopular}
                    onValueChange={(isPopular) =>
                      void toggle(updateArea({ id: a.id, body: { isPopular } }).unwrap())
                    }
                  />
                  <Toggle
                    label="Active"
                    value={a.isActive}
                    onValueChange={(isActive) =>
                      void toggle(updateArea({ id: a.id, body: { isActive } }).unwrap())
                    }
                  />
                </VStack>
              </Card>
            ))}
            {areas?.length === 0 ? (
              <EmptyState
                title="No areas yet"
                description="Add the localities people search for."
              />
            ) : null}
          </>
        ) : (
          <>
            <Button label="Add city" variant="tonal" onPress={() => router.push('/place-form')} />
            {(cities ?? []).map((c) => (
              <Pressable key={c.id} accessibilityRole="button" onPress={() => setCity(c)}>
                <Card padding="md">
                  <HStack justify="space-between" align="center">
                    <VStack gap="xxs">
                      <AppText variant="bodyStrong">{c.name}</AppText>
                      <AppText variant="caption" color="textSecondary">
                        {c.state}
                      </AppText>
                    </VStack>
                    <Pill
                      label={c.isActive ? 'Live' : 'Hidden'}
                      tone={c.isActive ? 'success' : 'neutral'}
                    />
                  </HStack>
                </Card>
              </Pressable>
            ))}
          </>
        )}
      </VStack>
    </Screen>
  );
}
