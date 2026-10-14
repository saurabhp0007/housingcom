import {
  AppText,
  Button,
  Card,
  HStack,
  Loader,
  Pill,
  Screen,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { authApi } from '@/features/auth/auth.api';
import { useSession } from '@/features/auth/hooks/useSession';
import { useMyVerificationQuery, verificationApi } from '@/features/verification/verification.api';
import { uploadMultipart } from '@/shared/api/upload';
import { prepareImageForUpload } from '@/shared/media/prepare-image';
import { useAppDispatch } from '@/shared/store/hooks';
import { userUpdated } from '@/shared/store/session.slice';

type DocKey = 'idProof' | 'propertyProof';

const DOCS: { key: DocKey; title: string; hint: string }[] = [
  { key: 'idProof', title: 'Photo ID', hint: 'Aadhaar, PAN, driving licence or passport' },
  {
    key: 'propertyProof',
    title: 'Property proof',
    hint: 'Electricity bill, rent agreement or property tax receipt',
  },
];

/** Lister verification: two document photos → admin review → Verified badge + instant publishing. */
export default function VerificationScreen() {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { user } = useSession();
  const { data, isLoading } = useMyVerificationQuery();
  const [docs, setDocs] = useState<Partial<Record<DocKey, ImagePicker.ImagePickerAsset>>>({});
  const [progress, setProgress] = useState<number | null>(null);

  const pick = async (key: DocKey) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    const result = perm.granted
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled && result.assets[0]) setDocs((d) => ({ ...d, [key]: result.assets[0] }));
  };

  const submit = async () => {
    if (!docs.idProof || !docs.propertyProof) return;
    setProgress(0);
    try {
      // Documents keep more resolution so small print stays readable.
      const parts = await Promise.all(
        DOCS.map(async ({ key }) => ({
          field: key,
          ...(await prepareImageForUpload(docs[key]!, 2400)),
        })),
      );
      await uploadMultipart('/me/verification', parts, setProgress);
      dispatch(verificationApi.util.invalidateTags(['Verification']));
      setDocs({});
      toast.show('Documents submitted for review');
    } catch (e) {
      toast.show((e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  // Once approved, refresh the session user so the Verified state shows everywhere.
  const sessionVerified = !!user?.lister?.isVerified;
  useEffect(() => {
    if (!data?.isVerified || sessionVerified) return;
    void dispatch(authApi.endpoints.me.initiate(undefined, { forceRefetch: true }))
      .unwrap()
      .then((u) => dispatch(userUpdated(u)))
      .catch(() => undefined);
  }, [data?.isVerified, sessionVerified, dispatch]);

  if (isLoading || !data) {
    return (
      <Screen edges={['bottom']}>
        <VStack flex={1} align="center" justify="center">
          <Loader />
        </VStack>
      </Screen>
    );
  }

  const latest = data.latest;
  const pending = latest?.status === 'pending';

  return (
    <Screen
      scroll
      edges={['bottom']}
      footer={
        !data.isVerified && !pending ? (
          <Button
            label={
              progress !== null
                ? `Uploading ${Math.round(progress * 100)}%`
                : 'Submit for verification'
            }
            loading={progress !== null}
            disabled={!docs.idProof || !docs.propertyProof}
            onPress={() => void submit()}
          />
        ) : undefined
      }
    >
      <VStack gap="xl" style={{ paddingTop: 16 }}>
        <Card tone={data.isVerified ? 'primary' : 'surface'}>
          <VStack gap="sm">
            <HStack gap="sm" align="center">
              <AppText variant="heading">
                {data.isVerified ? 'You are verified' : 'Get the Verified badge'}
              </AppText>
              {data.isVerified ? (
                <Pill label="Verified" tone="verified" />
              ) : pending ? (
                <Pill label="In review" tone="warning" />
              ) : null}
            </HStack>
            <AppText color="textSecondary">
              {data.isVerified
                ? 'Your listings go live instantly and show the Verified badge.'
                : pending
                  ? 'We are checking your documents. This usually takes less than a day.'
                  : 'Verified listers get a badge customers trust, and their listings go live without waiting for review.'}
            </AppText>
            {latest?.status === 'rejected' && latest.rejectionReason ? (
              <AppText color="danger">Previous request: {latest.rejectionReason}</AppText>
            ) : null}
          </VStack>
        </Card>

        {!data.isVerified && !pending ? (
          <VStack gap="md">
            {DOCS.map((d) => {
              const asset = docs[d.key];
              return (
                <Pressable
                  key={d.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${asset ? 'Retake' : 'Add'} ${d.title}`}
                  onPress={() => void pick(d.key)}
                  style={[
                    styles.doc,
                    {
                      borderColor: asset ? colors.primary : colors.border,
                      borderRadius: radius.lg,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  {asset ? (
                    <Image
                      source={{ uri: asset.uri }}
                      style={[styles.thumb, { borderRadius: radius.md }]}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.thumb,
                        { borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
                      ]}
                    />
                  )}
                  <VStack gap="xxs" flex={1}>
                    <AppText variant="bodyStrong">{d.title}</AppText>
                    <AppText variant="caption" color="textSecondary">
                      {asset ? 'Tap to retake' : d.hint}
                    </AppText>
                  </VStack>
                </Pressable>
              );
            })}
            <AppText variant="caption" color="textSecondary">
              Documents are stored privately and only our verification team can see them.
            </AppText>
          </VStack>
        ) : null}
      </VStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  doc: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1 },
  thumb: { width: 64, height: 64 },
});
