import { AppText, Button, Chip, HStack, Screen, TextField, VStack, useToast } from '@housingcom/ui';
import { ListerType } from '@housingcom/contracts';
import { router } from 'expo-router';
import { useState } from 'react';
import { useBecomeListerMutation } from '@/features/auth/auth.api';
import { toAppError } from '@/shared/api/api-error';
import { useAppDispatch } from '@/shared/store/hooks';
import { userUpdated } from '@/shared/store/session.slice';

const OPTIONS: { value: ListerType; label: string }[] = [
  { value: ListerType.Owner, label: 'Owner' },
  { value: ListerType.Dealer, label: 'Dealer / Broker' },
  { value: ListerType.PgOperator, label: 'PG operator' },
];

/** Presented as a native form sheet (see root layout). */
export default function ListerOnboardingScreen() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [type, setType] = useState<ListerType>(ListerType.Owner);
  const [businessName, setBusinessName] = useState('');
  const [becomeLister, { isLoading }] = useBecomeListerMutation();

  const submit = async () => {
    try {
      const user = await becomeLister({
        listerType: type,
        businessName: type === ListerType.Owner ? undefined : businessName.trim() || undefined,
      }).unwrap();
      dispatch(userUpdated(user));
      toast.show("You're a lister now. Post your first property!");
      router.back();
      router.push('/lister');
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      footer={<Button label="Continue" loading={isLoading} onPress={submit} />}
    >
      <VStack gap="xl" style={{ paddingTop: 24 }}>
        <VStack gap="sm">
          <AppText variant="title">List your property</AppText>
          <AppText color="textSecondary">
            Tell us who you are. Verified listers go live instantly.
          </AppText>
        </VStack>
        <HStack gap="sm" wrap>
          {OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={type === o.value}
              onPress={() => setType(o.value)}
            />
          ))}
        </HStack>
        {type !== ListerType.Owner ? (
          <TextField
            label="Business name"
            placeholder={type === ListerType.PgOperator ? 'e.g. Sunrise PG' : 'e.g. Prime Realty'}
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
            maxLength={120}
          />
        ) : null}
      </VStack>
    </Screen>
  );
}
