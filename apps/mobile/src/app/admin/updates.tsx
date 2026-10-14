import { UpdateChannel, type OtaUpdateResponse } from '@housingcom/contracts';
import {
  AppText,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  HStack,
  Pill,
  Sheet,
  TextField,
  Toggle,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { FlashList } from '@shopify/flash-list';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  adminApi,
  useChangeOtaUpdateMutation,
  useOtaUpdatesQuery,
} from '@/features/admin/admin.api';
import { toAppError } from '@/shared/api/api-error';
import { uploadMultipart } from '@/shared/api/upload';
import { useAppDispatch } from '@/shared/store/hooks';

const CHANNELS = Object.values(UpdateChannel);
const ROLLOUTS = [1, 5, 10, 25, 50, 100];

interface PublishForm {
  file: DocumentPicker.DocumentPickerAsset;
  channel: UpdateChannel;
  rollout: number;
  critical: boolean;
  message: string;
}

/**
 * OTA updates, managed entirely from the app: publish a bundle (zip from `pnpm ota:publish --dry-run`,
 * picked from Files / Drive), stage the rollout, pause, resume and roll back, and watch crash rates.
 */
export default function AppUpdatesScreen() {
  const { spacing, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [channel, setChannel] = useState<UpdateChannel | undefined>();
  const { data, isLoading, isFetching, refetch } = useOtaUpdatesQuery(
    { channel },
    { pollingInterval: 30_000 },
  );
  const [change] = useChangeOtaUpdateMutation();
  const [active, setActive] = useState<OtaUpdateResponse | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<OtaUpdateResponse | null>(null);
  const [form, setForm] = useState<PublishForm | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const run = async (work: Promise<unknown>, done: string) => {
    try {
      await work;
      toast.show(done);
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  const pickBundle = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/zip', 'application/x-zip-compressed'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    setForm({
      file: result.assets[0],
      channel: channel ?? UpdateChannel.Production,
      rollout: 100,
      critical: false,
      message: '',
    });
  };

  const publish = async () => {
    if (!form) return;
    setProgress(0);
    try {
      const res = await uploadMultipart<{ updates: OtaUpdateResponse[] }>(
        '/ota/updates',
        [
          { field: 'bundle', uri: form.file.uri, name: form.file.name, type: 'application/zip' },
          { field: 'channel', value: form.channel },
          { field: 'rolloutPercent', value: String(form.rollout) },
          { field: 'isCritical', value: String(form.critical) },
          ...(form.message.trim() ? [{ field: 'message', value: form.message.trim() }] : []),
          { field: 'publishedBy', value: 'app' },
        ],
        setProgress,
      );
      setForm(null);
      dispatch(adminApi.util.invalidateTags(['AdminOta']));
      toast.show(`Published for ${res.updates.map((u) => u.platform).join(' + ')}`);
    } catch (e) {
      toast.show((e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <VStack gap="sm" style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <HStack gap="sm" wrap>
          <Chip label="All" selected={!channel} onPress={() => setChannel(undefined)} />
          {CHANNELS.map((c) => (
            <Chip key={c} label={c} selected={channel === c} onPress={() => setChannel(c)} />
          ))}
        </HStack>
      </VStack>

      <FlashList
        data={data?.items ?? []}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 + insets.bottom }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="No updates yet"
              description="Publish a bundle built with pnpm ota:publish --dry-run."
            />
          )
        }
        renderItem={({ item: u }) => (
          <Pressable
            accessibilityRole="button"
            disabled={u.status === 'rolled_back'}
            onPress={() => setActive(u)}
          >
            <Card padding="md">
              <VStack gap="xs">
                <HStack justify="space-between" align="center">
                  <AppText variant="bodyStrong">
                    {u.platform === 'ios' ? 'iOS' : 'Android'} · {u.channel}
                  </AppText>
                  <HStack gap="xs">
                    {u.isCritical ? <Pill label="Critical" tone="primary" /> : null}
                    <Pill
                      label={u.status.replace('_', ' ')}
                      tone={
                        u.status === 'active'
                          ? 'success'
                          : u.status === 'paused'
                            ? 'warning'
                            : 'danger'
                      }
                    />
                  </HStack>
                </HStack>
                {u.message ? <AppText numberOfLines={2}>{u.message}</AppText> : null}
                <AppText variant="caption" color="textSecondary">
                  {new Date(u.createdAt).toLocaleString('en-IN')} · runtime{' '}
                  {u.runtimeVersion.slice(0, 8)}
                </AppText>
                <AppText variant="caption" color={u.crashRate >= 0.05 ? 'danger' : 'textSecondary'}>
                  {u.rolloutPercent}% rollout · {u.launchCount} launches ·{' '}
                  {(u.crashRate * 100).toFixed(1)}% crashes
                </AppText>
              </VStack>
            </Card>
          </Pressable>
        )}
      />

      <View style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg + insets.bottom }}>
        <Button label="Publish update" fullWidth={false} onPress={() => void pickBundle()} />
      </View>

      {/* Manage one update */}
      <Sheet visible={!!active} onDismiss={() => setActive(null)} title="Manage update">
        {active ? (
          <VStack gap="md">
            <AppText variant="label" color="textSecondary">
              ROLLOUT
            </AppText>
            <HStack gap="sm" wrap>
              {ROLLOUTS.map((r) => (
                <Chip
                  key={r}
                  label={`${r}%`}
                  selected={active.rolloutPercent === r}
                  onPress={() => {
                    setActive({ ...active, rolloutPercent: r });
                    void run(
                      change({ id: active.id, rolloutPercent: r }).unwrap(),
                      `Rollout set to ${r}%`,
                    );
                  }}
                />
              ))}
            </HStack>
            {active.status === 'active' ? (
              <Button
                label="Pause"
                variant="outlined"
                onPress={() => {
                  setActive(null);
                  void run(change({ id: active.id, status: 'paused' }).unwrap(), 'Paused');
                }}
              />
            ) : (
              <Button
                label="Resume"
                onPress={() => {
                  setActive(null);
                  void run(change({ id: active.id, status: 'active' }).unwrap(), 'Resumed');
                }}
              />
            )}
            <Button
              label="Roll back"
              variant="destructive"
              onPress={() => {
                setConfirmRollback(active);
                setActive(null);
              }}
            />
          </VStack>
        ) : null}
      </Sheet>

      {/* Publish form */}
      <Sheet
        visible={!!form}
        onDismiss={() => progress === null && setForm(null)}
        title="Publish update"
        snapPoints={['full']}
        dismissible={progress === null}
      >
        {form ? (
          <VStack gap="md">
            <AppText color="textSecondary" numberOfLines={1}>
              {form.file.name} · {((form.file.size ?? 0) / 1048576).toFixed(1)} MB
            </AppText>
            <AppText variant="label" color="textSecondary">
              CHANNEL
            </AppText>
            <HStack gap="sm" wrap>
              {CHANNELS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={form.channel === c}
                  onPress={() => setForm({ ...form, channel: c })}
                />
              ))}
            </HStack>
            <AppText variant="label" color="textSecondary">
              ROLLOUT
            </AppText>
            <HStack gap="sm" wrap>
              {ROLLOUTS.map((r) => (
                <Chip
                  key={r}
                  label={`${r}%`}
                  selected={form.rollout === r}
                  onPress={() => setForm({ ...form, rollout: r })}
                />
              ))}
            </HStack>
            <Toggle
              label="Critical: apply immediately on launch"
              value={form.critical}
              onValueChange={(critical) => setForm({ ...form, critical })}
            />
            <TextField
              label="Release note"
              value={form.message}
              onChangeText={(message) => setForm({ ...form, message })}
              maxLength={500}
              placeholder="e.g. Fix crash on OTP screen"
            />
            <Button
              label={progress !== null ? `Uploading ${Math.round(progress * 100)}%` : 'Publish'}
              loading={progress !== null}
              onPress={() => void publish()}
            />
          </VStack>
        ) : null}
      </Sheet>

      <ConfirmDialog
        visible={!!confirmRollback}
        title="Roll back this update?"
        message="Devices stop receiving it and return to the previous good update or the built-in bundle. This can't be undone."
        confirmLabel="Roll back"
        destructive
        onDismiss={() => setConfirmRollback(null)}
        onConfirm={() => {
          const target = confirmRollback;
          setConfirmRollback(null);
          if (target)
            void run(change({ id: target.id, status: 'rolled_back' }).unwrap(), 'Rolled back');
        }}
      />
    </View>
  );
}
