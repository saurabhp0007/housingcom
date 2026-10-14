import { UserRole, type AdminUserResponse } from '@housingcom/contracts';
import {
  AppText,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  HStack,
  Pill,
  TextField,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { maskPhone } from '@housingcom/utils';
import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAdminUsersQuery, useSetUserBlockedMutation } from '@/features/admin/admin.api';
import { useSession } from '@/features/auth/hooks/useSession';
import { toAppError } from '@/shared/api/api-error';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const ROLES: { label: string; role?: UserRole }[] = [
  { label: 'Everyone' },
  { label: 'Listers', role: UserRole.Lister },
  { label: 'Admins', role: UserRole.Admin },
];

/** Search users by name/phone/email and block or unblock them. */
export default function UsersScreen() {
  const { spacing } = useTheme();
  const toast = useToast();
  const { user: me } = useSession();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<UserRole | undefined>();
  const query = useDebouncedValue(q.trim(), 350);
  const { data } = useAdminUsersQuery({ q: query || undefined, role });
  const [setBlocked] = useSetUserBlockedMutation();
  const [target, setTarget] = useState<AdminUserResponse | null>(null);

  const confirm = async () => {
    if (!target) return;
    const blocked = target.status !== 'blocked';
    setTarget(null);
    try {
      await setBlocked({ id: target.id, blocked }).unwrap();
      toast.show(blocked ? 'User blocked and signed out' : 'User unblocked');
    } catch (e) {
      toast.show(toAppError(e).message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <VStack gap="sm" style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <TextField
          label="Search"
          placeholder="Name, phone or email"
          value={q}
          onChangeText={setQ}
          returnKey="search"
          autoCapitalize="none"
        />
        <HStack gap="sm">
          {ROLES.map((r) => (
            <Chip
              key={r.label}
              label={r.label}
              selected={role === r.role}
              onPress={() => setRole(r.role)}
            />
          ))}
        </HStack>
      </VStack>
      <FlashList
        data={data?.items ?? []}
        keyExtractor={(u) => u.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<EmptyState title="No users found" />}
        renderItem={({ item: u }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityHint={u.status === 'blocked' ? 'Unblock user' : 'Block user'}
            disabled={u.id === me?.id || u.roles.includes(UserRole.Admin)}
            onPress={() => setTarget(u)}
          >
            <Card padding="md">
              <HStack justify="space-between" align="center" gap="sm">
                <VStack gap="xxs" flex={1}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {u.name ?? 'Unnamed'}
                  </AppText>
                  <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                    {[u.phone ? maskPhone(u.phone) : null, u.email].filter(Boolean).join(' · ')}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {u.listingCount} listings · joined{' '}
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </AppText>
                </VStack>
                <VStack gap="xxs" align="flex-end">
                  {u.status === 'blocked' ? <Pill label="Blocked" tone="danger" /> : null}
                  {u.roles.includes(UserRole.Admin) ? <Pill label="Admin" tone="primary" /> : null}
                  {u.isVerifiedLister ? (
                    <Pill label="Verified" tone="verified" />
                  ) : u.roles.includes(UserRole.Lister) ? (
                    <Pill label="Lister" />
                  ) : null}
                </VStack>
              </HStack>
            </Card>
          </Pressable>
        )}
      />
      <ConfirmDialog
        visible={!!target}
        title={target?.status === 'blocked' ? 'Unblock this user?' : 'Block this user?'}
        message={
          target?.status === 'blocked'
            ? 'They will be able to sign in again.'
            : 'They will be signed out on all devices immediately and cannot sign in.'
        }
        confirmLabel={target?.status === 'blocked' ? 'Unblock' : 'Block'}
        destructive={target?.status !== 'blocked'}
        onDismiss={() => setTarget(null)}
        onConfirm={() => void confirm()}
      />
    </View>
  );
}
