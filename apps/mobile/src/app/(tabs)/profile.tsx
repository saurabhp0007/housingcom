import { UserRole } from '@housingcom/contracts';
import { AppText, Button, ConfirmDialog, HStack, Screen, VStack, useTheme } from '@housingcom/ui';
import { maskPhone } from '@housingcom/utils';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppVersionCard } from '@/features/app-updates/components/AppVersionCard';
import { useSession } from '@/features/auth/hooks/useSession';
import { sessionService } from '@/features/auth/services/session.service';
import { useAppDispatch } from '@/shared/store/hooks';

export default function ProfileScreen() {
  const { colors, radius, spacing } = useTheme();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLister } = useSession();
  const isAdmin = !!user?.roles.includes(UserRole.Admin);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <Screen scroll edges={['top']}>
      <VStack gap="xl" style={{ paddingTop: spacing.md }}>
        <AppText variant="title">Profile</AppText>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          {isAuthenticated && user ? (
            <HStack gap="md" align="center">
              <SymbolView
                name={{ ios: 'person.crop.circle.fill', android: 'account_circle' }}
                size={48}
                tintColor={colors.primary}
              />
              <VStack gap="xxs" flex={1}>
                <AppText variant="heading">{user.fullName ?? 'Your account'}</AppText>
                <AppText color="textSecondary">
                  {user.phone ? maskPhone(user.phone) : (user.email ?? '')}
                </AppText>
                {user.lister ? (
                  <AppText variant="label" color="primary">
                    {user.lister.isVerified ? 'VERIFIED LISTER' : 'LISTER'}
                  </AppText>
                ) : null}
              </VStack>
            </HStack>
          ) : (
            <VStack gap="md">
              <AppText variant="heading">Sign in to do more</AppText>
              <AppText color="textSecondary">
                Save listings, contact owners and get alerts for new places.
              </AppText>
              <Button label="Sign in" onPress={() => router.push('/login')} />
            </VStack>
          )}
        </View>

        {isAuthenticated ? (
          <Button label="My visits" variant="tonal" onPress={() => router.push('/visits')} />
        ) : null}

        {isLister || isAdmin ? (
          <VStack gap="sm">
            {isLister ? (
              <Button
                label="Lister dashboard"
                variant="tonal"
                onPress={() => router.push('/lister')}
              />
            ) : null}
            {isAdmin ? (
              <Button label="Admin panel" variant="tonal" onPress={() => router.push('/admin')} />
            ) : null}
          </VStack>
        ) : null}

        {isAuthenticated && !isLister ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primaryMuted,
                borderRadius: radius.lg,
                padding: spacing.lg,
              },
            ]}
          >
            <VStack gap="sm">
              <AppText variant="heading">Have a room, flat or PG?</AppText>
              <AppText color="textSecondary">
                Switch to lister mode and reach people looking in your area.
              </AppText>
              <Button
                label="List your property"
                variant="primary"
                onPress={() => router.push('/lister-onboarding')}
              />
            </VStack>
          </View>
        ) : null}

        <AppVersionCard />

        {isAuthenticated ? (
          <Button
            label="Log out"
            variant="text"
            fullWidth={false}
            onPress={() => setConfirmLogout(true)}
          />
        ) : null}
      </VStack>

      <ConfirmDialog
        visible={confirmLogout}
        title="Log out?"
        message="You can sign back in anytime with your phone number."
        confirmLabel="Log out"
        destructive
        onDismiss={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void sessionService.signOut(dispatch);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ card: { borderWidth: 1 } });
