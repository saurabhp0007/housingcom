import type { FeaturedPlanResponse } from '@housingcom/contracts';
import { AppText, HStack, VStack, useTheme } from '@housingcom/ui';
import { formatInr } from '@housingcom/utils';
import { Pressable } from 'react-native';

interface PlanOptionProps {
  plan: FeaturedPlanResponse;
  selected: boolean;
  onPress: () => void;
}

/** A selectable featured plan row: name, duration, per-day price and total. */
export function PlanOption({ plan, selected, onPress }: PlanOptionProps) {
  const { colors, radius, spacing } = useTheme();
  const perDay = Math.round(plan.priceInr / plan.durationDays);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${plan.name}, ${plan.durationDays} days, ${formatInr(plan.priceInr)}`}
      onPress={onPress}
      style={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.border,
        borderRadius: radius.lg,
        padding: spacing.md,
        backgroundColor: selected ? colors.primaryMuted : colors.surface,
      }}
    >
      <HStack justify="space-between" align="center">
        <VStack gap="xxs">
          <AppText variant="bodyStrong">{plan.name}</AppText>
          <AppText variant="caption" color="textSecondary">
            {plan.durationDays} days · {formatInr(perDay)}/day
          </AppText>
        </VStack>
        <AppText variant="heading">{formatInr(plan.priceInr)}</AppText>
      </HStack>
    </Pressable>
  );
}
