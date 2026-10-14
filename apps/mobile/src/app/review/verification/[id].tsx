import {
  AppText,
  Button,
  Card,
  EmptyState,
  HStack,
  Loader,
  Pill,
  Screen,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import {
  useAdminVerificationQuery,
  useApproveVerificationMutation,
  useRejectVerificationMutation,
} from '@/features/admin/admin.api';
import { RejectSheet } from '@/features/admin/components/RejectSheet';
import { toAppError } from '@/shared/api/api-error';
import { env } from '@/shared/config/env';
import { useAppSelector } from '@/shared/store/hooks';

const PRESETS = [
  'Document is blurry or cut off',
  'Name does not match the account',
  'Property proof is missing or expired',
  'Document type not accepted',
];

/** Admin review of lister documents. Images load from the admin-only API route with the token. */
export default function ReviewVerificationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { radius, colors } = useTheme();
  const toast = useToast();
  const token = useAppSelector((s) => s.session.accessToken);
  const { data: request, isLoading } = useAdminVerificationQuery(id);
  const [approve, approveState] = useApproveVerificationMutation();
  const [reject, rejectState] = useRejectVerificationMutation();
  const [rejecting, setRejecting] = useState(false);

  const run = async (work: Promise<unknown>, done: string) => {
    try {
      await work;
      toast.show(done);
      router.back();
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <VStack flex={1} align="center" justify="center">
          <Loader />
        </VStack>
      </Screen>
    );
  }
  if (!request)
    return (
      <Screen>
        <EmptyState title="Request not found" />
      </Screen>
    );

  const doc = (which: 'id' | 'property') => ({
    uri: `${env.apiUrl}/admin/verifications/${request.id}/documents/${which}`,
    headers: { authorization: `Bearer ${token}` },
  });
  const pending = request.status === 'pending';

  return (
    <>
      <Stack.Screen options={{ title: 'Review verification' }} />
      <Screen
        scroll
        edges={['bottom']}
        footer={
          pending ? (
            <HStack gap="sm">
              <View style={{ flex: 1 }}>
                <Button label="Reject" variant="outlined" onPress={() => setRejecting(true)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Verify lister"
                  loading={approveState.isLoading}
                  onPress={() => void run(approve(request.id).unwrap(), 'Lister verified')}
                />
              </View>
            </HStack>
          ) : undefined
        }
      >
        <VStack gap="lg" style={{ paddingTop: 16 }}>
          <Card>
            <VStack gap="xxs">
              <HStack gap="sm" align="center">
                <AppText variant="heading">{request.user?.name ?? 'Unnamed lister'}</AppText>
                <Pill
                  label={request.status}
                  tone={pending ? 'warning' : request.status === 'approved' ? 'success' : 'danger'}
                />
              </HStack>
              <AppText color="textSecondary">{request.user?.phone}</AppText>
              <AppText variant="caption" color="textSecondary">
                {request.user?.listerType?.replace('_', ' ')} · submitted{' '}
                {new Date(request.createdAt).toLocaleString('en-IN')}
              </AppText>
              {request.rejectionReason ? (
                <AppText color="danger">{request.rejectionReason}</AppText>
              ) : null}
            </VStack>
          </Card>
          {(['id', 'property'] as const).map((which) => (
            <VStack key={which} gap="sm">
              <AppText variant="label" color="textSecondary">
                {which === 'id' ? 'PHOTO ID' : 'PROPERTY PROOF'}
              </AppText>
              <Image
                source={doc(which)}
                // Private documents are kept in memory only, never in the shared disk cache.
                cachePolicy="memory"
                contentFit="contain"
                style={{
                  width: '100%',
                  aspectRatio: 3 / 4,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surfaceMuted,
                }}
              />
            </VStack>
          ))}
        </VStack>
      </Screen>
      <RejectSheet
        visible={rejecting}
        title="Reject verification"
        presets={PRESETS}
        loading={rejectState.isLoading}
        onDismiss={() => setRejecting(false)}
        onSubmit={(reason) => {
          setRejecting(false);
          void run(
            reject({ id: request.id, reason }).unwrap(),
            'Rejected: the lister has been told why',
          );
        }}
      />
    </>
  );
}
