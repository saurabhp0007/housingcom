import type { BannerResponse } from '@housingcom/contracts';
import { AppText, VStack, useTheme } from '@housingcom/ui';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useBannersQuery } from '../content.api';

/** In-app routes open in the app; https links open in the in-app browser (no app switch). */
export function openBannerLink(url: string | null): void {
  if (!url) return;
  if (url.startsWith('/')) router.push(url as Href);
  else void WebBrowser.openBrowserAsync(url);
}

/** Admin-managed promos on Home (PRD §5 "banners"), for everyone or the user's city. */
export function BannerCarousel({ cityId }: { cityId: string | null }) {
  const { colors, radius, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const { data } = useBannersQuery({ cityId });
  if (!data?.length) return null;
  const cardWidth = width - spacing.lg * 2;

  return (
    <ScrollView
      horizontal
      pagingEnabled={data.length > 1}
      snapToInterval={cardWidth + spacing.sm}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm }}
      style={{ marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, flexGrow: 0 }}
    >
      {data.map((b: BannerResponse) => (
        <Pressable
          key={b.id}
          accessibilityRole={b.linkUrl ? 'link' : 'image'}
          accessibilityLabel={[b.title, b.subtitle].filter(Boolean).join('. ')}
          disabled={!b.linkUrl}
          onPress={() => openBannerLink(b.linkUrl)}
          style={[
            styles.card,
            { width: cardWidth, borderRadius: radius.lg, backgroundColor: colors.primary },
          ]}
        >
          {b.imageUrl ? (
            <Image
              source={{ uri: b.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : null}
          <View style={[StyleSheet.absoluteFill, b.imageUrl ? styles.scrim : null]} />
          <VStack gap="xxs" style={{ padding: spacing.lg }}>
            <AppText variant="heading" style={styles.light}>
              {b.title}
            </AppText>
            {b.subtitle ? <AppText style={styles.light}>{b.subtitle}</AppText> : null}
          </VStack>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { aspectRatio: 2, overflow: 'hidden', justifyContent: 'flex-end' },
  scrim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  light: { color: '#FFFFFF' },
});
