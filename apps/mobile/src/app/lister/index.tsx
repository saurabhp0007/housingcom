import { ListingStatus, type MyListingResponse } from '@housingcom/contracts';
import {
  AppText,
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  Pill,
  Sheet,
  Skeleton,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { STATUS_META } from '@/features/listings/listing-labels';
import {
  useDeleteListingMutation,
  useListingLifecycleMutation,
  useMyListingsQuery,
} from '@/features/listings/listings.api';
import { toAppError } from '@/shared/api/api-error';

const FILTERS: { label: string; status?: ListingStatus }[] = [
  { label: 'All' },
  { label: 'Live', status: ListingStatus.Live },
  { label: 'In review', status: ListingStatus.PendingApproval },
  { label: 'Needs changes', status: ListingStatus.Rejected },
  { label: 'Drafts', status: ListingStatus.Draft },
  { label: 'Paused', status: ListingStatus.Paused },
  { label: 'Filled', status: ListingStatus.Filled },
];

export default function MyListingsScreen() {
  const { spacing, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [filter, setFilter] = useState<ListingStatus | undefined>();
  const { data, isLoading, isFetching, refetch } = useMyListingsQuery(filter);
  const [lifecycle, lifecycleState] = useListingLifecycleMutation();
  const [deleteListing] = useDeleteListingMutation();
  const [active, setActive] = useState<MyListingResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MyListingResponse | null>(null);

  const act = async (action: 'pause' | 'resume' | 'mark-filled' | 'submit') => {
    if (!active) return;
    try {
      await lifecycle({ id: active.id, action }).unwrap();
      setActive(null);
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteListing(target.id).unwrap();
      toast.show('Listing deleted');
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        {FILTERS.map((f) => (
          <Chip
            key={f.label}
            label={f.label}
            selected={filter === f.status}
            onPress={() => setFilter(f.status)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <VStack gap="lg" style={{ padding: spacing.lg }}>
          <Skeleton height={260} radius="lg" />
          <Skeleton height={260} radius="lg" />
        </VStack>
      ) : (
        <FlashList
          data={data ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: 96 + insets.bottom,
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={filter ? 'Nothing here' : 'List your first property'}
              description={
                filter
                  ? 'No listings with this status.'
                  : 'It takes about 3 minutes. Add photos for 3× more enquiries.'
              }
              actionLabel={filter ? undefined : 'Add a listing'}
              onAction={filter ? undefined : () => router.push('/listing-editor/new')}
            />
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => setActive(item)}
              badge={
                <Pill label={STATUS_META[item.status].label} tone={STATUS_META[item.status].tone} />
              }
              footer={
                <VStack gap="xxs" style={{ marginTop: 6 }}>
                  {item.rejectionReason && item.status === 'rejected' ? (
                    <AppText variant="caption" color="danger" numberOfLines={2}>
                      {item.rejectionReason}
                    </AppText>
                  ) : null}
                  <AppText variant="caption" color="textSecondary">
                    {item.viewCount} views · {item.contactCount} contacts · {item.mediaCount} photos
                  </AppText>
                </VStack>
              }
            />
          )}
        />
      )}

      <View style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg + insets.bottom }}>
        <Button
          label="Add listing"
          fullWidth={false}
          onPress={() => router.push('/listing-editor/new')}
        />
      </View>

      <Sheet visible={!!active} onDismiss={() => setActive(null)} title={active?.title}>
        {active ? (
          <VStack gap="sm">
            <Button
              label="Edit"
              variant="tonal"
              onPress={() => {
                setActive(null);
                router.push(`/listing-editor/${active.id}`);
              }}
            />
            {active.status === 'live' ? (
              <Button
                label="View public page"
                variant="tonal"
                onPress={() => {
                  setActive(null);
                  router.push(`/listing/${active.id}`);
                }}
              />
            ) : null}
            {active.status === 'draft' || active.status === 'rejected' ? (
              <Button
                label="Submit"
                loading={lifecycleState.isLoading}
                onPress={() => void act('submit')}
              />
            ) : null}
            {active.status === 'live' ? (
              <Button label="Pause" variant="outlined" onPress={() => void act('pause')} />
            ) : null}
            {active.status === 'paused' || active.status === 'filled' ? (
              <Button label="Make live again" onPress={() => void act('resume')} />
            ) : null}
            {active.status === 'live' || active.status === 'paused' ? (
              <Button
                label="Mark as filled"
                variant="outlined"
                onPress={() => void act('mark-filled')}
              />
            ) : null}
            <Button
              label="Delete"
              variant="text"
              onPress={() => {
                setConfirmDelete(active);
                setActive(null);
              }}
            />
          </VStack>
        ) : null}
      </Sheet>

      <ConfirmDialog
        visible={!!confirmDelete}
        title="Delete this listing?"
        message="It will be removed from the app. This can't be undone."
        confirmLabel="Delete"
        destructive
        onDismiss={() => setConfirmDelete(null)}
        onConfirm={() => void remove()}
      />
    </View>
  );
}
