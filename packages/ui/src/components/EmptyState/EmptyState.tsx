import type { ReactNode } from 'react';
import { AppText } from '../../primitives/AppText';
import { VStack } from '../../primitives/Stack';
import { Button } from '../Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

/** Empty, error and permission-denied states share this layout. */
export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <VStack flex={1} align="center" justify="center" gap="md" padding="xxl">
      {icon}
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText color="textSecondary" align="center">
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="tonal" fullWidth={false} />
      ) : null}
    </VStack>
  );
}
