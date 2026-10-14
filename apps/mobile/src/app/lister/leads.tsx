import {
  ContactChannel,
  VisitStatus,
  type LeadResponse,
  type VisitResponse,
} from '@housingcom/contracts';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  HStack,
  Loader,
  Pill,
  Sheet,
  Skeleton,
  TextField,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { maskPhone, timeAgo } from '@housingcom/utils';
import { FlashList } from '@shopify/flash-list';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import {
  useLeadsInfiniteQuery,
  useRespondVisitMutation,
} from '@/features/engagement/engagement.api';
import { VISIT_STATUS_META, visitWhen } from '@/features/engagement/visit-labels';
import { toAppError } from '@/shared/api/api-error';

const CHANNEL_LABELS: Record<ContactChannel, string> = {
  call: 'Called',
  whatsapp: 'WhatsApp',
  chat: 'Chat',
};

/** Lister inbox: everyone who reached out, with their visit requests to confirm or decline. */
export default function LeadsScreen() {
  const { spacing, colors } = useTheme();
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useLeadsInfiniteQuery(undefined, { refetchOnFocus: true });
  const [responding, setResponding] = useState<{
    visit: VisitResponse;
    status: 'confirmed' | 'declined';
  } | null>(null);
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Skeleton height={140} radius="lg" />
      </View>
    );
  }

  return (
    <>
      <FlashList
        data={items}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        onEndReachedThreshold={0.6}
        onEndReached={() => hasNextPage && !isFetchingNextPage && void fetchNextPage()}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={isFetchingNextPage ? <Loader /> : null}
        ListEmptyComponent={
          <EmptyState
            title="No enquiries yet"
            description="When someone calls, chats or asks to visit, they show up here."
          />
        }
        renderItem={({ item }) => (
          <LeadCard lead={item} onRespond={(visit, status) => setResponding({ visit, status })} />
        )}
      />
      <RespondSheet value={responding} onDismiss={() => setResponding(null)} />
    </>
  );
}

function LeadCard({
  lead,
  onRespond,
}: {
  lead: LeadResponse;
  onRespond: (visit: VisitResponse, status: 'confirmed' | 'declined') => void;
}) {
  const phone = lead.customer.phone;
  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="space-between" align="center" gap="sm">
          <VStack flex={1} gap="xxs">
            <AppText variant="bodyStrong">{lead.customer.name ?? 'Tenant'}</AppText>
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {lead.listing.title}
            </AppText>
          </VStack>
          <AppText variant="caption" color="textSecondary">
            {timeAgo(lead.lastContactAt)}
          </AppText>
        </HStack>
        <HStack gap="xs" wrap>
          {lead.channels.map((c) => (
            <Pill key={c} label={CHANNEL_LABELS[c]} />
          ))}
          {phone ? <Pill label={maskPhone(phone)} tone="neutral" /> : null}
        </HStack>

        {lead.visits.map((v) => (
          <VStack key={v.id} gap="xs">
            <HStack justify="space-between" align="center" gap="sm">
              <AppText style={{ flex: 1 }}>Visit · {visitWhen(v)}</AppText>
              <Pill
                label={VISIT_STATUS_META[v.status].label}
                tone={VISIT_STATUS_META[v.status].tone}
              />
            </HStack>
            {v.note ? <AppText color="textSecondary">“{v.note}”</AppText> : null}
            {v.status === VisitStatus.Requested ? (
              <HStack gap="sm">
                <View style={{ flex: 1 }}>
                  <Button label="Confirm" onPress={() => onRespond(v, 'confirmed')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Decline"
                    variant="outlined"
                    onPress={() => onRespond(v, 'declined')}
                  />
                </View>
              </HStack>
            ) : null}
          </VStack>
        ))}

        <HStack gap="sm">
          {phone ? (
            <View style={{ flex: 1 }}>
              <Button
                label="Call"
                variant="tonal"
                onPress={() => void Linking.openURL(`tel:${phone}`)}
              />
            </View>
          ) : null}
          {lead.conversationId ? (
            <View style={{ flex: 1 }}>
              <Button
                label="Open chat"
                variant="tonal"
                onPress={() => router.push(`/chat/${lead.conversationId}`)}
              />
            </View>
          ) : null}
        </HStack>
      </VStack>
    </Card>
  );
}

function RespondSheet({
  value,
  onDismiss,
}: {
  value: { visit: VisitResponse; status: 'confirmed' | 'declined' } | null;
  onDismiss: () => void;
}) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [respond, { isLoading }] = useRespondVisitMutation();
  const confirming = value?.status === 'confirmed';

  const submit = async () => {
    if (!value) return;
    try {
      await respond({
        id: value.visit.id,
        body: { status: value.status, note: note.trim() || undefined },
      }).unwrap();
      setNote('');
      onDismiss();
      toast.show({
        message: confirming ? 'Visit confirmed. The tenant has been notified.' : 'Visit declined.',
      });
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Sheet
      visible={!!value}
      onDismiss={onDismiss}
      title={confirming ? 'Confirm visit' : 'Decline visit'}
    >
      <VStack gap="md">
        {value ? <AppText color="textSecondary">{visitWhen(value.visit)}</AppText> : null}
        <TextField
          label={confirming ? 'Directions or a note (optional)' : 'Suggest another time (optional)'}
          value={note}
          onChangeText={setNote}
          maxLength={300}
          multiline
        />
        <Button
          label={confirming ? 'Confirm visit' : 'Decline visit'}
          variant={confirming ? 'primary' : 'destructive'}
          loading={isLoading}
          onPress={() => void submit()}
        />
      </VStack>
    </Sheet>
  );
}
