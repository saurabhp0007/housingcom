import type { MessageResponse } from '@housingcom/contracts';
import { AppText, EmptyState, Loader, Screen, VStack, useTheme, useToast } from '@housingcom/ui';
import { clockTime, formatInr } from '@housingcom/utils';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSession } from '@/features/auth/hooks/useSession';
import {
  useConversationQuery,
  useMarkConversationReadMutation,
  useMessagesInfiniteQuery,
  useSendMessageMutation,
} from '@/features/chat/chat.api';
import { addMessageToCache, setActiveConversation } from '@/features/chat/chat.realtime';
import { toAppError } from '@/shared/api/api-error';
import { useAppDispatch } from '@/shared/store/hooks';

const MAX_LENGTH = 2000;

/** One chat thread (deep link from push: /chat/<id>). New messages arrive over Socket.IO. */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { user } = useSession();
  const { data: conversation } = useConversationQuery(id);
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMessagesInfiniteQuery(id);
  const [send, { isLoading: sending }] = useSendMessageMutation();
  const [markRead] = useMarkConversationReadMutation();
  const [draft, setDraft] = useState('');

  // While this thread is on screen: no banners for it, and incoming messages count as read.
  useFocusEffect(
    useCallback(() => {
      setActiveConversation(id);
      void markRead(id);
      return () => setActiveConversation(null);
    }, [id, markRead]),
  );
  useEffect(() => () => setActiveConversation(null), []);

  const messages = useMemo(() => data?.pages.flat() ?? [], [data]);

  const submit = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    try {
      addMessageToCache(dispatch, await send({ conversationId: id, body }).unwrap());
    } catch (e) {
      setDraft(body);
      toast.show({ message: toAppError(e).message });
    }
  };

  const title = conversation?.counterpart.name ?? (conversation?.iAmOwner ? 'Tenant' : 'Owner');

  return (
    <>
      <Stack.Screen options={{ title, headerShown: true, headerBackTitle: 'Inbox' }} />
      <Screen
        edges={['bottom']}
        padded={false}
        footer={
          <View
            style={[
              styles.composer,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Message"
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={MAX_LENGTH}
              style={[
                styles.input,
                { color: colors.textPrimary, backgroundColor: colors.surfaceMuted },
              ]}
              accessibilityLabel="Message"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              disabled={!draft.trim() || sending}
              onPress={() => void submit()}
              hitSlop={8}
            >
              <SymbolView
                name={{ ios: 'arrow.up.circle.fill', android: 'send' }}
                size={34}
                tintColor={draft.trim() ? colors.primary : colors.textSecondary}
              />
            </Pressable>
          </View>
        }
      >
        {conversation ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/listing/${conversation.listing.id}`)}
            style={[styles.listingBar, { borderBottomColor: colors.border, padding: spacing.md }]}
          >
            <VStack flex={1} gap="xxs">
              <AppText variant="bodyStrong" numberOfLines={1}>
                {conversation.listing.title}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {formatInr(conversation.listing.rent)}/month
                {conversation.listing.areaName ? ` · ${conversation.listing.areaName}` : ''}
              </AppText>
            </VStack>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right' }}
              size={16}
              tintColor={colors.textSecondary}
            />
          </Pressable>
        ) : null}

        {isLoading ? (
          <VStack flex={1} align="center" justify="center">
            <Loader />
          </VStack>
        ) : isError ? (
          <EmptyState title="Conversation unavailable" description="It may have been removed." />
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onEndReachedThreshold={0.3}
            onEndReached={() => hasNextPage && !isFetchingNextPage && void fetchNextPage()}
            ListFooterComponent={isFetchingNextPage ? <Loader /> : null}
            ListEmptyComponent={
              <View style={{ transform: [{ scaleY: -1 }] }}>
                <AppText color="textSecondary" align="center">
                  Say hello and ask anything about the place.
                </AppText>
              </View>
            }
            renderItem={({ item }) => <Bubble message={item} mine={item.senderId === user?.id} />}
          />
        )}
      </Screen>
    </>
  );
}

function Bubble({ message, mine }: { message: MessageResponse; mine: boolean }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={[
        styles.bubble,
        {
          alignSelf: mine ? 'flex-end' : 'flex-start',
          backgroundColor: mine ? colors.primary : colors.surface,
          borderColor: mine ? colors.primary : colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <AppText style={{ color: mine ? '#fff' : colors.textPrimary }}>{message.body}</AppText>
      <AppText
        variant="caption"
        align="right"
        style={{ color: mine ? 'rgba(255,255,255,0.8)' : colors.textSecondary }}
      >
        {clockTime(message.createdAt)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  listingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bubble: { maxWidth: '80%', borderWidth: StyleSheet.hairlineWidth, gap: 2 },
});
