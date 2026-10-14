import { EmptyState, Screen } from '@housingcom/ui';
import { router } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <Screen edges={['bottom']}>
      <EmptyState
        title="Page not found"
        description="This link may be broken or the page was removed."
        actionLabel="Go home"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
