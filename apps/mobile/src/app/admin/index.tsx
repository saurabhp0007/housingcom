import { AppText, Screen, Skeleton, StatTile, VStack } from '@housingcom/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useAdminDashboardQuery } from '@/features/admin/admin.api';

export default function AdminDashboardScreen() {
  const { data, isLoading } = useAdminDashboardQuery(undefined, {
    pollingInterval: 60_000,
    refetchOnFocus: true,
  });

  return (
    <Screen scroll edges={['bottom']}>
      <VStack gap="xl" style={{ paddingTop: 16 }}>
        {isLoading || !data ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.cell}>
                <Skeleton height={96} radius="lg" />
              </View>
            ))}
          </View>
        ) : (
          <>
            <Section title="Needs attention">
              <Tile
                label="Listings to review"
                value={data.listings.pendingApproval}
                emphasis={data.listings.pendingApproval > 0}
                onPress={() => router.push('/admin/approvals')}
              />
              <Tile
                label="Verifications"
                value={data.verifications.pending}
                emphasis={data.verifications.pending > 0}
                onPress={() => router.push('/admin/verifications')}
              />
              <Tile
                label="Open reports"
                value={data.reports.open}
                emphasis={data.reports.open > 0}
                onPress={() => router.push('/admin/reports')}
              />
            </Section>
            <Section title="Listings">
              <Tile label="Live" value={data.listings.live} />
              <Tile label="All listings" value={data.listings.total} />
            </Section>
            <Section title="People">
              <Tile
                label="Users"
                value={data.users.total}
                onPress={() => router.push('/admin/users')}
              />
              <Tile label="Listers" value={data.users.listers} />
              <Tile label="New this week" value={data.users.newLast7Days} />
            </Section>
          </>
        )}
      </VStack>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <VStack gap="sm">
      <AppText variant="label" color="textSecondary">
        {title.toUpperCase()}
      </AppText>
      <View style={styles.grid}>{children}</View>
    </VStack>
  );
}

function Tile(props: React.ComponentProps<typeof StatTile>) {
  return (
    <View style={styles.cell}>
      <StatTile {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '48%', flexGrow: 1 },
});
