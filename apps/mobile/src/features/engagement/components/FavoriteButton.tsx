import { useTheme } from '@housingcom/ui';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import { useSession } from '@/features/auth/hooks/useSession';
import { useFavoriteIdsQuery, useSetFavoriteMutation } from '../engagement.api';

interface FavoriteButtonProps {
  listingId: string;
  /** 'overlay' sits on a photo (white disc); 'plain' sits on the page background. */
  appearance?: 'overlay' | 'plain';
}

/** Heart toggle. Optimistic; guests are sent to sign in. */
export function FavoriteButton({ listingId, appearance = 'overlay' }: FavoriteButtonProps) {
  const { colors } = useTheme();
  const { isAuthenticated } = useSession();
  const { data: ids } = useFavoriteIdsQuery(undefined, { skip: !isAuthenticated });
  const [setFavorite] = useSetFavoriteMutation();
  const saved = !!ids?.includes(listingId);

  const toggle = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void setFavorite({ listingId, saved: !saved });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from saved' : 'Save listing'}
      accessibilityState={{ selected: saved }}
      hitSlop={8}
      onPress={toggle}
      style={[
        styles.button,
        appearance === 'overlay' && { backgroundColor: 'rgba(255,255,255,0.92)' },
      ]}
    >
      <SymbolView
        name={
          saved
            ? { ios: 'heart.fill', android: 'favorite' }
            : { ios: 'heart', android: 'favorite_border' }
        }
        size={20}
        tintColor={
          saved ? colors.danger : appearance === 'overlay' ? '#1F2937' : colors.textPrimary
        }
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
