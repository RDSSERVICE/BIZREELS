/**
 * Profile Screen — displays the authenticated user's full profile
 * fetched from GET /users/me via useCurrentUserProfile().
 *
 * Layout:
 *  ┌─────────────────────────────────────┐
 *  │  Avatar  Name  Role badge           │  ← header
 *  │  Email                              │
 *  │  KYC status  •  Subscription plan   │
 *  ├─────────────────────────────────────┤
 *  │  Followers  |  Following  |  Rating │  ← stats row
 *  ├─────────────────────────────────────┤
 *  │  Wallet Balance  card               │  ← wallet
 *  ├─────────────────────────────────────┤
 *  │  About  section (personal details)  │  ← info rows
 *  ├─────────────────────────────────────┤
 *  │  Log Out button                     │
 *  └─────────────────────────────────────┘
 */

import { RoleSwitcher } from '@/components/role-switcher';
import {
    BrandColors,
    Colors,
    FontSize,
    FontWeight,
    Radius,
    Spacing,
} from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCurrentUserProfile } from '@/features/auth/queries';
import { useTheme } from '@/hooks/use-theme';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function capitalize(str: string | null | undefined): string {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KycBadge({ status }: { status: string }) {
  const color =
    status === 'verified'
      ? BrandColors.success
      : status === 'pending'
      ? BrandColors.warning
      : '#9CA3AF';

  return (
    <View style={[badgeStyles.pill, { borderColor: color }]}>
      <View style={[badgeStyles.dot, { backgroundColor: color }]} />
      <Text style={[badgeStyles.label, { color }]}>
        KYC {capitalize(status)}
      </Text>
    </View>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <View style={badgeStyles.rolePill}>
      <Text style={badgeStyles.roleLabel}>{capitalize(role)}</Text>
    </View>
  );
}

function StatItem({
  value,
  label,
  theme,
}: {
  value: string | number;
  label: string;
  theme: typeof Colors.light;
}) {
  return (
    <View style={statStyles.item}>
      <Text style={[statStyles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[statStyles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function Divider({ theme }: { theme: typeof Colors.light }) {
  return <View style={[dividerStyle.line, { backgroundColor: theme.border }]} />;
}

function InfoRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: typeof Colors.light;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[infoStyles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { signOut } = useAuth();

  const { data: user, isLoading, isError, refetch, isRefetching } = useCurrentUserProfile();

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View
        style={[
          styles.centered,
          { paddingTop: insets.top, backgroundColor: theme.background },
        ]}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError || !user) {
    return (
      <View
        style={[
          styles.centered,
          { paddingTop: insets.top, backgroundColor: theme.background },
        ]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          Could not load profile.
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const avatarUrl = user.profile_pic ?? user.avatarUrl;
  const initials = getInitials(user.name);
  const ratingDisplay =
    user.rating_count > 0
      ? `${user.rating_avg.toFixed(1)} (${user.rating_count})`
      : '—';
  const locationDisplay =
    [user.location?.city, user.location?.state]
      .filter(Boolean)
      .join(', ') || '—';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + Spacing.four },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={BrandColors.primary}
          colors={[BrandColors.primary]}
        />
      }>

      {/* ── Header card ─────────────────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Name + role */}
        <View style={styles.headerMeta}>
          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <RoleSwitcher />
        </View>

        {/* Email */}
        <Text style={[styles.email, { color: theme.textSecondary }]}>
          {user.email}
        </Text>

        {/* Badges row */}
        <View style={styles.badgesRow}>
          <KycBadge status={user.kyc_status} />
          <View style={[badgeStyles.pill, { borderColor: theme.border }]}>
            <Text style={[badgeStyles.label, { color: theme.textSecondary }]}>
              {user.subscription.plan}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <View style={[styles.card, styles.statsRow, { backgroundColor: theme.backgroundElement }]}>
        <StatItem value={user.followersCount} label="Followers" theme={theme} />
        <View style={[statStyles.divider, { backgroundColor: theme.border }]} />
        <StatItem value={user.followingCount} label="Following" theme={theme} />
        <View style={[statStyles.divider, { backgroundColor: theme.border }]} />
        <StatItem value={ratingDisplay} label="Rating" theme={theme} />
      </View>

      {/* ── Customer Quick Actions ───────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Shopping & Orders</Text>
        <Divider theme={theme} />
        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/orders')}>
          <Text style={[styles.actionRowText, { color: theme.text }]}>📦 My Orders</Text>
          <Text style={styles.actionRowArrow}>›</Text>
        </Pressable>
        <Divider theme={theme} />
        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/cart')}>
          <Text style={[styles.actionRowText, { color: theme.text }]}>🛒 Shopping Cart</Text>
          <Text style={styles.actionRowArrow}>›</Text>
        </Pressable>
      </View>

      {/* ── Wallet card ─────────────────────────────────────────────────── */}
      <View style={[styles.walletCard, { backgroundColor: BrandColors.primary }]}>
        <Text style={styles.walletLabel}>Wallet Balance</Text>
        <Text style={styles.walletAmount}>
          ₹{user.walletBalance.toLocaleString('en-IN')}
        </Text>
        <Text style={styles.walletSub}>
          Subscription · {user.subscription.plan} · {capitalize(user.subscription.status)}
        </Text>
      </View>

      {/* ── About section ───────────────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
        <Divider theme={theme} />
        <InfoRow label="Language" value={user.language ?? '—'} theme={theme} />
        <Divider theme={theme} />
        <InfoRow label="Gender" value={capitalize(user.gender)} theme={theme} />
        <Divider theme={theme} />
        <InfoRow label="Date of Birth" value={formatDate(user.dob)} theme={theme} />
        <Divider theme={theme} />
        <InfoRow label="Occupation" value={capitalize(user.occupation)} theme={theme} />
        <Divider theme={theme} />
        <InfoRow label="Location" value={locationDisplay} theme={theme} />
        <Divider theme={theme} />
        <InfoRow label="Member Since" value={formatDate(user.created_at)} theme={theme} />
      </View>

      {/* ── Log out ─────────────────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutBtn,
          { borderColor: BrandColors.error },
          pressed && { opacity: 0.7 },
        ]}
        onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>

      <View style={{ height: insets.bottom + Spacing.seven }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  errorText: {
    fontSize: FontSize.base,
  },
  retryBtn: {
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: BrandColors.primary,
  },
  retryText: {
    color: BrandColors.primary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.base,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.three,
  },
  // Header
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
  },
  avatarFallback: {
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  email: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.one,
  },
  // Wallet
  walletCard: {
    borderRadius: Radius.lg,
    padding: Spacing.five,
    gap: Spacing.one,
  },
  walletLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  walletAmount: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  walletSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.65)',
  },
  // Section
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.one,
  },
  // Logout
  logoutBtn: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  logoutText: {
    color: BrandColors.error,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.base,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  actionRowText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  actionRowArrow: {
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.4)',
  },
});

const badgeStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  rolePill: {
    backgroundColor: BrandColors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  roleLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: '#FFFFFF',
  },
});

const statStyles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  divider: {
    width: 1,
    height: 36,
  },
});

const dividerStyle = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.one,
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  label: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  value: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
});
