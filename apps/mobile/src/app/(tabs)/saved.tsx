import { EmptyState, Screen } from '@housingcom/ui';
import { router } from 'expo-router';
import { useSession } from '@/features/auth/hooks/useSession';

export default function SavedScreen() {
  const { isAuthenticated } = useSession();

  return (
    <Screen edges={['top']}>
      {isAuthenticated ? (
        <EmptyState
          title="Nothing saved yet"
          description="Tap the heart on any listing to keep it here."
        />
      ) : (
        <EmptyState
          title="Save places you like"
          description="Sign in to save listings and get alerts when similar places go live."
          actionLabel="Sign in"
          onAction={() => router.push('/login')}
        />
      )}
    </Screen>
  );
}
