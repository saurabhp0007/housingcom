import { AppText, Button, HStack, Pill, Sheet, VStack, useTheme, useToast } from '@housingcom/ui';
import { LISTING_LIMITS, type ListingMediaResponse } from '@housingcom/contracts';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppDispatch } from '@/shared/store/hooks';
import { listingsApi, useDeleteMediaMutation, useReorderMediaMutation } from '../listings.api';
import { uploadListingAsset, validateAsset } from '../services/media-upload.service';

interface Uploading {
  key: string;
  uri: string;
  progress: number;
}

interface PhotoManagerProps {
  listingId: string;
  media: ListingMediaResponse[];
}

/** Gallery editor: add from camera/library (uploads with progress), set cover, remove. */
export function PhotoManager({ listingId, media }: PhotoManagerProps) {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [addSheet, setAddSheet] = useState(false);
  const [selected, setSelected] = useState<ListingMediaResponse | null>(null);
  const [reorder] = useReorderMediaMutation();
  const [removeMedia] = useDeleteMediaMutation();

  const images = media.filter((m) => m.kind === 'image');
  const remaining = LISTING_LIMITS.maxImages - images.length;

  const refresh = () =>
    dispatch(listingsApi.util.invalidateTags([{ type: 'Listing', id: listingId }, 'MyListings']));

  const uploadAll = async (assets: ImagePicker.ImagePickerAsset[]) => {
    for (const asset of assets) {
      const problem = validateAsset(asset);
      if (problem) {
        toast.show(problem);
        continue;
      }
      const key = `${asset.uri}-${Date.now()}`;
      setUploading((u) => [...u, { key, uri: asset.uri, progress: 0 }]);
      try {
        await uploadListingAsset(listingId, asset, (p) =>
          setUploading((u) => u.map((x) => (x.key === key ? { ...x, progress: p } : x))),
        );
        refresh();
      } catch (e) {
        toast.show((e as Error).message);
      } finally {
        setUploading((u) => u.filter((x) => x.key !== key));
      }
    }
  };

  const pick = async (source: 'camera' | 'library') => {
    setAddSheet(false);
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return toast.show('Allow camera access in Settings to take photos.');
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (!res.canceled) await uploadAll(res.assets);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, remaining),
      quality: 0.85,
      videoMaxDuration: 90,
    });
    if (!res.canceled) await uploadAll(res.assets);
  };

  const makeCover = async (item: ListingMediaResponse) => {
    setSelected(null);
    const ids = [item.id, ...media.filter((m) => m.id !== item.id).map((m) => m.id)];
    await reorder({ id: listingId, mediaIds: ids })
      .unwrap()
      .catch(() => toast.show("Couldn't change the cover photo"));
  };

  const remove = async (item: ListingMediaResponse) => {
    setSelected(null);
    await removeMedia({ id: listingId, mediaId: item.id })
      .unwrap()
      .catch(() => toast.show("Couldn't remove the photo"));
  };

  const tile = { borderRadius: radius.md, backgroundColor: colors.surfaceMuted };

  return (
    <VStack gap="md">
      <AppText color="textSecondary">
        Add up to {LISTING_LIMITS.maxImages} photos and one short video. The first photo is the
        cover. Bright, wide shots of every room get the most enquiries.
      </AppText>

      <View style={styles.grid}>
        {media.map((m, i) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={i === 0 ? 'Cover photo, options' : 'Photo options'}
            onPress={() => setSelected(m)}
            style={[styles.tile, tile]}
          >
            {m.kind === 'video' ? (
              <View style={styles.center}>
                <SymbolView
                  name={{ ios: 'play.circle.fill', android: 'play_circle' }}
                  size={32}
                  tintColor={colors.textSecondary}
                />
              </View>
            ) : (
              <Image
                source={{ uri: m.thumbnailUrl ?? m.url }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            )}
            {i === 0 && m.kind === 'image' ? (
              <View style={styles.badge}>
                <Pill label="Cover" tone="primary" />
              </View>
            ) : null}
          </Pressable>
        ))}

        {uploading.map((u) => (
          <View key={u.key} style={[styles.tile, tile]}>
            <Image
              source={{ uri: u.uri }}
              style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
              contentFit="cover"
            />
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(u.progress * 100)}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>
        ))}

        {remaining > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add photos"
            onPress={() => setAddSheet(true)}
            style={[
              styles.tile,
              tile,
              styles.center,
              { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border },
            ]}
          >
            <SymbolView
              name={{ ios: 'plus', android: 'add' }}
              size={28}
              tintColor={colors.primary}
            />
            <AppText variant="caption" color="primary">
              Add
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <Sheet visible={addSheet} onDismiss={() => setAddSheet(false)} title="Add photos">
        <VStack gap="sm">
          <Button label="Take a photo" variant="tonal" onPress={() => void pick('camera')} />
          <Button
            label="Choose from gallery"
            variant="tonal"
            onPress={() => void pick('library')}
          />
        </VStack>
      </Sheet>

      <Sheet visible={!!selected} onDismiss={() => setSelected(null)} title="Photo">
        <HStack gap="sm">
          {selected && selected.kind === 'image' && media[0]?.id !== selected.id ? (
            <View style={{ flex: 1 }}>
              <Button label="Make cover" variant="tonal" onPress={() => void makeCover(selected)} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              label="Remove"
              variant="destructive"
              onPress={() => selected && void remove(selected)}
            />
          </View>
        </HStack>
      </Sheet>
    </VStack>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31.5%', aspectRatio: 1, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  badge: { position: 'absolute', left: 6, top: 6 },
  progressTrack: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 10,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 4 },
});
