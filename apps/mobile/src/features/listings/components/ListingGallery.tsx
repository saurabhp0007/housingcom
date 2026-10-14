import { AppText, useTheme } from '@housingcom/ui';
import type { ListingMediaResponse } from '@housingcom/contracts';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

function VideoSlide({ url, width }: { url: string; width: number }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });
  return (
    <VideoView
      player={player}
      style={{ width, aspectRatio: 4 / 3 }}
      contentFit="contain"
      nativeControls
    />
  );
}

/** Full-width swipeable photo/video gallery with a page counter. */
export function ListingGallery({ media }: { media: ListingMediaResponse[] }) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);

  if (media.length === 0) {
    return <View style={{ width, aspectRatio: 4 / 3, backgroundColor: colors.surfaceMuted }} />;
  }

  return (
    <View>
      <FlatList
        data={media}
        keyExtractor={(m) => m.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) =>
          item.kind === 'video' ? (
            <VideoSlide url={item.url} width={width} />
          ) : (
            <Image
              source={{ uri: item.url }}
              placeholder={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
              contentFit="cover"
              transition={150}
              accessibilityIgnoresInvertColors
              style={{ width, aspectRatio: 4 / 3, backgroundColor: colors.surfaceMuted }}
            />
          )
        }
      />
      <View style={[styles.counter, { backgroundColor: colors.scrim }]}>
        <AppText variant="label" style={{ color: '#fff' }}>
          {index + 1} / {media.length}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
