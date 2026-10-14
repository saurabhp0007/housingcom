import { ContentPageSlug } from '@housingcom/contracts';
import { AppText, EmptyState, Screen, Skeleton, VStack, useTheme } from '@housingcom/ui';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useContentPageQuery } from '@/features/content/content.api';

const isSlug = (s: string): s is ContentPageSlug =>
  (Object.values(ContentPageSlug) as string[]).includes(s);

/** Terms, privacy policy and about, rendered as paragraphs (blank lines separate them). */
export default function ContentPageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { spacing } = useTheme();
  const valid = isSlug(slug);
  const { data, isLoading } = useContentPageQuery(valid ? slug : ContentPageSlug.Terms, {
    skip: !valid,
  });

  return (
    <>
      <Stack.Screen
        options={{ title: data?.title ?? '', headerShown: true, headerBackTitle: 'Back' }}
      />
      <Screen scroll edges={['bottom']}>
        <VStack gap="md" style={{ paddingVertical: spacing.lg }}>
          {!valid ? (
            <EmptyState title="Page not found" />
          ) : isLoading ? (
            <Skeleton height={240} radius="lg" />
          ) : data?.body ? (
            <>
              {data.body.split(/\n\s*\n/).map((para, i) => (
                <AppText key={i}>{para.trim()}</AppText>
              ))}
              {data.updatedAt ? (
                <AppText variant="caption" color="textSecondary">
                  Last updated{' '}
                  {new Date(data.updatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </AppText>
              ) : null}
            </>
          ) : (
            <EmptyState title="Coming soon" description="This page hasn't been published yet." />
          )}
        </VStack>
      </Screen>
    </>
  );
}
