import { ContentPageSlug, CONTENT_PAGE_TITLES, type FaqResponse } from '@housingcom/contracts';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  HStack,
  Screen,
  Skeleton,
  VStack,
  useTheme,
} from '@housingcom/ui';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { useAppConfigQuery } from '@/features/app-config/app-config.api';
import { useFaqsQuery } from '@/features/content/content.api';

/** Help & FAQs plus links to the legal pages; everything here is edited by admins in the app. */
export default function HelpScreen() {
  const { spacing } = useTheme();
  const { data: faqs, isLoading } = useFaqsQuery();
  const { data: config } = useAppConfigQuery(Platform.OS === 'ios' ? 'ios' : 'android');

  return (
    <>
      <Stack.Screen
        options={{ title: 'Help & FAQs', headerShown: true, headerBackTitle: 'Back' }}
      />
      <Screen scroll edges={['bottom']}>
        <VStack gap="lg" style={{ paddingTop: spacing.lg }}>
          {isLoading ? (
            <Skeleton height={160} radius="lg" />
          ) : faqs?.length ? (
            <VStack gap="sm">
              {faqs.map((f) => (
                <FaqItem key={f.id} faq={f} />
              ))}
            </VStack>
          ) : (
            <EmptyState title="No FAQs yet" description="Reach out below and we'll help." />
          )}

          {config?.supportPhone ? (
            <Button
              label="Call support"
              variant="tonal"
              onPress={() => void Linking.openURL(`tel:${config.supportPhone}`)}
            />
          ) : null}

          <VStack gap="xs">
            {Object.values(ContentPageSlug).map((slug) => (
              <Button
                key={slug}
                label={CONTENT_PAGE_TITLES[slug]}
                variant="text"
                fullWidth={false}
                onPress={() => router.push(`/page/${slug}`)}
              />
            ))}
          </VStack>
        </VStack>
      </Screen>
    </>
  );
}

function FaqItem({ faq }: { faq: FaqResponse }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen((v) => !v)}
    >
      <Card>
        <VStack gap="xs">
          <HStack gap="xs" align="center">
            <AppText variant="bodyStrong" style={{ flex: 1 }}>
              {faq.question}
            </AppText>
            <SymbolView
              name={
                open
                  ? { ios: 'chevron.up', android: 'expand_less' }
                  : { ios: 'chevron.down', android: 'expand_more' }
              }
              size={16}
              tintColor={colors.textSecondary}
            />
          </HStack>
          {open ? <AppText color="textSecondary">{faq.answer}</AppText> : null}
        </VStack>
      </Card>
    </Pressable>
  );
}
