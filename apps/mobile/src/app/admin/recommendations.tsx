import type { RecommendationWeights } from '@housingcom/contracts';
import {
  AppText,
  Button,
  Card,
  Loader,
  Screen,
  SliderField,
  VStack,
  useToast,
} from '@housingcom/ui';
import { useState } from 'react';
import {
  useRecommendationWeightsQuery,
  useUpdateRecommendationWeightsMutation,
} from '@/features/admin/admin.api';
import { toAppError } from '@/shared/api/api-error';

const FIELDS: { key: keyof RecommendationWeights; label: string; help: string }[] = [
  { key: 'distance', label: 'Distance', help: 'Closer to the searched place ranks higher.' },
  {
    key: 'personal',
    label: 'Personal taste',
    help: 'Like what the user viewed, shared, saved or contacted.',
  },
  { key: 'popularity', label: 'Popularity', help: 'More views and contacts rank higher.' },
  { key: 'freshness', label: 'Freshness', help: 'New and recently updated listings get a boost.' },
  { key: 'match', label: 'Budget fit', help: 'Rent close to the user’s budget ranks higher.' },
];

const DEFAULTS: RecommendationWeights = {
  distance: 0.35,
  match: 0.1,
  personal: 0.2,
  popularity: 0.2,
  freshness: 0.15,
};

/** Tunes the recommendation engine (PRD §5). Weights are relative; the server normalises them. */
export default function RecommendationSettingsScreen() {
  const toast = useToast();
  const { data } = useRecommendationWeightsQuery();
  const [save, saveState] = useUpdateRecommendationWeightsMutation();
  const [draft, setDraft] = useState<RecommendationWeights | null>(null);
  const weights = draft ?? data;

  if (!weights) {
    return (
      <Screen edges={['bottom']}>
        <VStack flex={1} align="center" justify="center">
          <Loader />
        </VStack>
      </Screen>
    );
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const share = (v: number) => `${Math.round((v / total) * 100)}%`;

  const submit = async () => {
    try {
      await save(weights).unwrap();
      setDraft(null);
      toast.show('Ranking updated for everyone');
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      footer={
        <VStack gap="sm">
          <Button
            label="Save"
            disabled={!draft}
            loading={saveState.isLoading}
            onPress={() => void submit()}
          />
          <Button label="Reset to defaults" variant="text" onPress={() => setDraft(DEFAULTS)} />
        </VStack>
      }
    >
      <VStack gap="xl" style={{ paddingTop: 16 }}>
        <Card tone="muted">
          <AppText variant="caption" color="textSecondary">
            “Recommended” ranks listings by these signals. Each percentage is that signal’s share of
            the score. Guests have no history, so “Personal taste” only applies to signed-in users.
          </AppText>
        </Card>
        {FIELDS.map((f) => (
          <SliderField
            key={f.key}
            label={f.label}
            helperText={f.help}
            value={weights[f.key]}
            step={0.05}
            format={share}
            onValueChange={(v) => setDraft({ ...weights, [f.key]: Math.round(v * 100) / 100 })}
          />
        ))}
      </VStack>
    </Screen>
  );
}
