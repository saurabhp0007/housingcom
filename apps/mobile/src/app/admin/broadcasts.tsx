import {
  AppText,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  HStack,
  Screen,
  TextField,
  VStack,
  useToast,
} from '@housingcom/ui';
import { timeAgo } from '@housingcom/utils';
import { useState } from 'react';
import { useCitiesQuery } from '@/features/location/geo.api';
import {
  useBroadcastsQuery,
  useSendBroadcastMutation,
} from '@/features/notifications/notifications.api';
import { toAppError } from '@/shared/api/api-error';

/** Announcements to every user or one city: inbox entry + push notification. */
export default function BroadcastsScreen() {
  const toast = useToast();
  const { data: cities } = useCitiesQuery();
  const { data: history } = useBroadcastsQuery();
  const [send, { isLoading }] = useSendBroadcastMutation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [cityId, setCityId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const valid = title.trim().length >= 3 && body.trim().length >= 3;
  const cityName = (id: string | null) =>
    id ? (cities?.find((c) => c.id === id)?.name ?? 'One city') : 'Everyone';

  const submit = async () => {
    setConfirming(false);
    try {
      const sent = await send({
        title: title.trim(),
        body: body.trim(),
        cityId: cityId ?? undefined,
      }).unwrap();
      setTitle('');
      setBody('');
      toast.show({ message: `Sent to ${sent.recipientCount} people.` });
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Screen scroll edges={['bottom']}>
      <VStack gap="lg" style={{ paddingTop: 16 }}>
        <VStack gap="md">
          <TextField label="Title" value={title} onChangeText={setTitle} maxLength={80} />
          <TextField
            label="Message"
            value={body}
            onChangeText={setBody}
            maxLength={300}
            multiline
          />
          <VStack gap="xs">
            <AppText variant="label" color="textSecondary">
              AUDIENCE
            </AppText>
            <HStack gap="xs" wrap>
              <Chip label="Everyone" selected={cityId === null} onPress={() => setCityId(null)} />
              {cities?.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  selected={cityId === c.id}
                  onPress={() => setCityId(c.id)}
                />
              ))}
            </HStack>
          </VStack>
          <Button
            label="Send announcement"
            disabled={!valid}
            loading={isLoading}
            onPress={() => setConfirming(true)}
          />
        </VStack>

        {history?.items.length ? (
          <VStack gap="sm">
            <AppText variant="heading">Sent</AppText>
            {history.items.map((b) => (
              <Card key={b.id}>
                <VStack gap="xxs">
                  <HStack justify="space-between" gap="sm">
                    <AppText variant="bodyStrong" style={{ flex: 1 }}>
                      {b.title}
                    </AppText>
                    <AppText variant="caption" color="textSecondary">
                      {timeAgo(b.createdAt)}
                    </AppText>
                  </HStack>
                  <AppText color="textSecondary">{b.body}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {cityName(b.cityId)} · {b.recipientCount} recipients
                  </AppText>
                </VStack>
              </Card>
            ))}
          </VStack>
        ) : null}
      </VStack>

      <ConfirmDialog
        visible={confirming}
        title={`Send to ${cityName(cityId)}?`}
        message="Everyone in this audience gets a push notification. This can't be undone."
        confirmLabel="Send"
        onDismiss={() => setConfirming(false)}
        onConfirm={() => void submit()}
      />
    </Screen>
  );
}
