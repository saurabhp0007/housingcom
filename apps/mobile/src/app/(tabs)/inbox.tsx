import type {
  ConversationResponse,
  NotificationResponse,
  NotificationType,
} from '@housingcom/contracts';
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  HStack,
  Loader,
  Screen,
  Skeleton,
  VStack,
  useTheme,
  Icon,
  type IconName,
} from '@housingcom/ui';
import { timeAgo } from '@housingcom/utils';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSession } from '@/features/auth/hooks/useSession';
import { useConversationsQuery } from '@/features/chat/chat.api';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsInfiniteQuery,
  useNotificationsUnreadCountQuery,
} from '@/features/notifications/notifications.api';

type Tab = 'messages' | 'updates';

/** Chats with owners/tenants, and app notifications (approvals, visits, alerts, announcements). */
export default function InboxScreen() {
  const { spacing } = useTheme();
  const { isAuthenticated } = useSession();
  const [tab, setTab] = useState<Tab>('messages');

  if (!isAuthenticated) {
    return (
      <Screen edges={['top']}>
        <EmptyState
          title="Your conversations live here"
          description="Sign in to chat with owners and get updates on your visits."
          actionLabel="Sign in"
          onAction={() => router.push('/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} padded={false}>
      <VStack gap="sm" style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <AppText variant="title">Inbox</AppText>
        <HStack gap="sm">
          <Chip label="Messages" selected={tab === 'messages'} onPress={() => setTab('messages')} />
          <Chip label="Updates" selected={tab === 'updates'} onPress={() => setTab('updates')} />
        </HStack>
      </VStack>
      {tab === 'messages' ? <Conversations /> : <Updates />}
    </Screen>
  );
}

function Conversations() {
  const { spacing, colors } = useTheme();
  const { data, isLoading, isFetching, refetch } = useConversationsQuery(undefined, {
    refetchOnFocus: true,
  });
  if (isLoading) {
    return (
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Skeleton height={64} radius="lg" />
        <Skeleton height={64} radius="lg" />
      </View>
    );
  }
  return (
    <FlashList
      data={data?.items ?? []}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ paddingVertical: spacing.sm }}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <EmptyState
          title="No messages yet"
          description="Use “Chat in app” on a listing to message the owner."
        />
      }
      renderItem={({ item }) => <ConversationRow conversation={item} />}
    />
  );
}

function ConversationRow({ conversation: c }: { conversation: ConversationResponse }) {
  const { spacing, colors, radius } = useTheme();
  const unread = c.unreadCount > 0;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/chat/${c.id}`)}
      style={({ pressed }) => [
        styles.row,
        { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Image
        source={c.listing.coverUrl ? { uri: c.listing.coverUrl } : undefined}
        style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.surfaceMuted }]}
        contentFit="cover"
      />
      <VStack flex={1} gap="xxs">
        <HStack justify="space-between" align="center" gap="sm">
          <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {c.counterpart.name ?? (c.iAmOwner ? 'Tenant' : 'Owner')}
          </AppText>
          <AppText variant="caption" color={unread ? 'primary' : 'textSecondary'}>
            {timeAgo(c.updatedAt)}
          </AppText>
        </HStack>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {c.listing.title}
        </AppText>
        <HStack gap="sm" align="center">
          <AppText
            variant={unread ? 'bodyStrong' : 'body'}
            color={unread ? 'textPrimary' : 'textSecondary'}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {c.lastMessage?.body ?? 'Say hello 👋'}
          </AppText>
          {unread ? (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <AppText variant="caption" style={{ color: '#fff' }}>
                {c.unreadCount}
              </AppText>
            </View>
          ) : null}
        </HStack>
      </VStack>
    </Pressable>
  );
}

const NOTIFICATION_ICONS: Partial<Record<NotificationType, IconName>> = {
  listing_approved: 'checkmark-circle',
  listing_rejected: 'alert-circle',
  listing_removed: 'ban',
  lister_verified: 'shield-checkmark',
  verification_rejected: 'shield',
  new_lead: 'person-add',
  visit_requested: 'calendar',
  visit_updated: 'calendar-number',
  saved_search_match: 'sparkles',
  announcement: 'megaphone',
  payment_received: 'ribbon',
  featured_expiring: 'time',
  featured_ended: 'star-half',
};

function Updates() {
  const { spacing, colors } = useTheme();
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useNotificationsInfiniteQuery();
  const unread = useNotificationsUnreadCountQuery().data?.count ?? 0;
  const [markAll] = useMarkAllNotificationsReadMutation();
  const [markRead] = useMarkNotificationReadMutation();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const open = (n: NotificationResponse) => {
    if (!n.readAt) void markRead(n.id);
    if (n.url) router.push(n.url as Href);
  };

  if (isLoading) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Skeleton height={64} radius="lg" />
      </View>
    );
  }
  return (
    <FlashList
      data={items}
      keyExtractor={(n) => n.id}
      onEndReachedThreshold={0.6}
      onEndReached={() => hasNextPage && !isFetchingNextPage && void fetchNextPage()}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        unread > 0 ? (
          <HStack justify="flex-end" style={{ paddingHorizontal: spacing.lg }}>
            <Button
              label="Mark all read"
              variant="text"
              fullWidth={false}
              onPress={() => void markAll()}
            />
          </HStack>
        ) : null
      }
      ListFooterComponent={isFetchingNextPage ? <Loader /> : null}
      ListEmptyComponent={
        <EmptyState
          title="You're all caught up"
          description="Visit confirmations, listing approvals and new matches show up here."
        />
      }
      renderItem={({ item: n }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => open(n)}
          style={({ pressed }) => [
            styles.row,
            {
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              opacity: pressed ? 0.7 : 1,
              backgroundColor: n.readAt ? undefined : colors.primaryMuted,
            },
          ]}
        >
          <Icon
            name={NOTIFICATION_ICONS[n.type] ?? 'notifications'}
            size={24}
            color={colors.primary}
          />
          <VStack flex={1} gap="xxs">
            <HStack justify="space-between" gap="sm">
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {n.title}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {timeAgo(n.createdAt)}
              </AppText>
            </HStack>
            <AppText color="textSecondary">{n.body}</AppText>
          </VStack>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 52, height: 52 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
