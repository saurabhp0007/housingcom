import type { ReviewResponse } from '@housingcom/contracts';
import { AppText, Button, Card, HStack, Sheet, TextField, VStack, useToast } from '@housingcom/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useSession } from '@/features/auth/hooks/useSession';
import { toAppError } from '@/shared/api/api-error';
import { useDeleteReviewMutation, useReviewsQuery, useSaveReviewMutation } from '../engagement.api';
import { StarRating } from './StarRating';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

/** Ratings & reviews on the listing page. Writing needs a prior contact or visit request. */
export function ReviewsSection({ listingId, isOwner }: { listingId: string; isOwner: boolean }) {
  const { isAuthenticated } = useSession();
  const { data } = useReviewsQuery(listingId);
  const [editing, setEditing] = useState(false);

  if (!data) return null;
  const others = data.items.filter((r) => r.id !== data.mine?.id);

  return (
    <VStack gap="sm">
      <HStack justify="space-between" align="center">
        <AppText variant="heading">Reviews</AppText>
        {data.average !== null ? (
          <HStack gap="xs" align="center">
            <StarRating value={data.average} />
            <AppText variant="bodyStrong">
              {data.average.toFixed(1)} · {data.count}
            </AppText>
          </HStack>
        ) : null}
      </HStack>

      {data.mine ? (
        <ReviewCard review={data.mine} mine onEdit={() => setEditing(true)} />
      ) : !isOwner ? (
        data.canReview ? (
          <Button label="Write a review" variant="tonal" onPress={() => setEditing(true)} />
        ) : (
          <AppText variant="caption" color="textSecondary">
            {isAuthenticated
              ? 'You can review this place after contacting the owner or scheduling a visit.'
              : 'Sign in and contact the owner to leave a review.'}
          </AppText>
        )
      ) : null}

      {others.length === 0 && !data.mine ? (
        <AppText color="textSecondary">No reviews yet.</AppText>
      ) : (
        others.map((r) => <ReviewCard key={r.id} review={r} />)
      )}

      {!isAuthenticated && !isOwner ? (
        <Button
          label="Sign in"
          variant="text"
          fullWidth={false}
          onPress={() => router.push('/login')}
        />
      ) : null}

      {/* Mounted per open so the form starts from the saved review each time. */}
      {editing ? (
        <ReviewSheet
          listingId={listingId}
          existing={data.mine}
          visible
          onDismiss={() => setEditing(false)}
        />
      ) : null}
    </VStack>
  );
}

function ReviewCard({
  review: r,
  mine,
  onEdit,
}: {
  review: ReviewResponse;
  mine?: boolean;
  onEdit?: () => void;
}) {
  return (
    <Card tone={mine ? 'muted' : 'surface'}>
      <VStack gap="xs">
        <HStack justify="space-between" align="center">
          <AppText variant="bodyStrong">
            {mine ? 'Your review' : (r.author.name ?? 'Tenant')}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {formatDate(r.updatedAt)}
          </AppText>
        </HStack>
        <StarRating value={r.rating} size={14} />
        {r.comment ? <AppText color="textSecondary">{r.comment}</AppText> : null}
        {mine && onEdit ? (
          <Button label="Edit" variant="text" fullWidth={false} onPress={onEdit} />
        ) : null}
      </VStack>
    </Card>
  );
}

function ReviewSheet({
  listingId,
  existing,
  visible,
  onDismiss,
}: {
  listingId: string;
  existing: ReviewResponse | null;
  visible: boolean;
  onDismiss: () => void;
}) {
  const toast = useToast();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [save, { isLoading }] = useSaveReviewMutation();
  const [remove, { isLoading: removing }] = useDeleteReviewMutation();

  const submit = async () => {
    try {
      await save({ listingId, body: { rating, comment: comment.trim() || undefined } }).unwrap();
      onDismiss();
      toast.show({ message: 'Thanks for your review!' });
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      title={existing ? 'Edit review' : 'Rate this place'}
    >
      <VStack gap="md">
        <StarRating value={rating} size={32} onChange={setRating} />
        <TextField
          label="What was it like? (optional)"
          value={comment}
          onChangeText={setComment}
          maxLength={1000}
          multiline
        />
        <Button
          label="Post review"
          disabled={rating < 1}
          loading={isLoading}
          onPress={() => void submit()}
        />
        {existing ? (
          <Button
            label="Delete review"
            variant="text"
            loading={removing}
            onPress={() =>
              void remove(listingId)
                .unwrap()
                .then(onDismiss)
                .catch((e: unknown) => toast.show({ message: toAppError(e).message }))
            }
          />
        ) : null}
      </VStack>
    </Sheet>
  );
}
