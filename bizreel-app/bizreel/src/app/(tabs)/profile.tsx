/**
 * Profile Screen — Classic Brutalist Yellow & Black palette
 * Minimalistic, clean, professional.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSwitcher } from '@/components/role-switcher';
import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCurrentUserProfile } from '@/features/auth/queries';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  const { data: user, isLoading, isError, refetch, isRefetching } = useCurrentUserProfile();

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={YELLOW} />
      </View>
    );
  }

  if (isError || !user) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={YELLOW} />
        <Text style={styles.errorText}>Could not load user profile.</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const avatarUrl = user.profile_pic ?? user.avatarUrl;
  const initials = user.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : 'U';

  const [vendorAnalytics, setVendorAnalytics] = useState<{
    callsCount: number;
    whatsappCount: number;
    chatsCount: number;
    inquiriesCount: number;
    savedReelsCount: number;
  } | null>(null);

  React.useEffect(() => {
    if (user?.activeRole === 'vendor' || user?.current_role === 'vendor' || user?.role === 'vendor') {
      api.get('/analytics/vendor')
        .then(({ data }) => setVendorAnalytics(data?.data || data))
        .catch((err) => console.warn('Failed to load vendor analytics', err));
    }
  }, [user]);

  const ratingDisplay = user.rating_count > 0 ? `${user.rating_avg.toFixed(1)} ★` : '4.9 ★';

  const CUSTOMER_MENU = [
    { label: 'Chat & Messages Inbox', route: '/messages', icon: 'chatbubble-ellipses-outline' },
    { label: 'My Requirements & Quotes', route: '/post-requirement', icon: 'mail-outline' },
    { label: 'My Orders', route: '/orders', icon: 'cart-outline' },
    { label: 'Saved Reels & Bookmarks', route: '/saved-reels', icon: 'bookmark-outline' },
  ];

  const VENDOR_MENU = [
    { label: 'Store Dashboard & Analytics', route: '/vendor/dashboard', icon: 'grid-outline' },
    { label: 'Video Reels & AI Ads', route: '/vendor/reels', icon: 'videocam-outline' },
    { label: 'Product & Service Catalog', route: '/vendor/listings', icon: 'cube-outline' },
    { label: 'Customer Orders & Requests', route: '/vendor/orders', icon: 'cart-outline' },
    { label: 'Chat & Inbox Messages', route: '/messages', icon: 'chatbubble-ellipses-outline' },
    { label: 'KYC Business Verification', route: '/vendor/verification', icon: 'shield-checkmark-outline' },
    { label: 'Store Settings & Operations', route: '/vendor/settings', icon: 'options-outline' },
  ];

  const CREATOR_MENU = [
    { label: 'Creator Studio Dashboard', route: '/creator/dashboard', icon: 'grid-outline' },
    { label: 'Portfolio Gallery & Reels', route: '/creator/portfolio', icon: 'film-outline' },
    { label: 'Package Rates & Pricing', route: '/creator/pricing', icon: 'pricetag-outline' },
    { label: 'Availability Schedule', route: '/creator/availability', icon: 'calendar-outline' },
    { label: 'Campaign Orders & Shoots', route: '/creator/orders', icon: 'briefcase-outline' },
    { label: 'Client Messages & Inbox', route: '/messages', icon: 'chatbubble-ellipses-outline' },
    { label: 'KYC Identity Verification', route: '/creator/verification', icon: 'shield-checkmark-outline' },
    { label: 'Reels Analytics', route: '/creator/analytics', icon: 'stats-chart-outline' },
    { label: 'Reviews & Feedback', route: '/creator/reviews', icon: 'star-outline' },
    { label: 'Studio Settings', route: '/creator/settings', icon: 'options-outline' },
  ];

  const FINANCE_MENU = [
    { label: 'Subscription & Billing', route: '/vendor/subscription', icon: 'card-outline' },
    { label: 'Vendor Wallet & Credits', route: '/vendor/wallet', icon: 'wallet-outline' },
    { label: 'Credit Rate Schedule', route: '/vendor/rates', icon: 'flash-outline' },
    { label: 'Refer & Earn Rewards', route: '/vendor/referrals', icon: 'person-add-outline' },
  ];

  const CREATOR_FINANCE_MENU = [
    { label: 'Creator Subscription Plan', route: '/creator/subscription', icon: 'card-outline' },
    { label: 'Wallet & Payout Earnings', route: '/creator/wallet', icon: 'wallet-outline' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* App Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.logoutIconBtn}
            onPress={() => router.push('/messages' as any)}
            accessibilityLabel="Chat Inbox">
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={YELLOW} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={YELLOW} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={YELLOW}
            colors={[YELLOW]}
          />
        }>

        {/* ── User Profile Header Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.verifiedDot}>
              <Ionicons name="checkmark" size={8} color={BLACK} />
            </View>
          </View>

          <View style={styles.userInfoCol}>
            <View style={styles.nameRoleRow}>
              <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
              <RoleSwitcher />
            </View>

            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>

            <View style={styles.badgePillsRow}>
              <View style={styles.kycBadge}>
                <View style={styles.kycDot} />
                <Text style={styles.kycText}>
                  KYC {user.kyc_status?.toUpperCase() || 'VERIFIED'}
                </Text>
              </View>
              <View style={styles.planBadge}>
                <Text style={styles.planText}>
                  {user.subscription?.plan?.toUpperCase() || 'STARTER PLAN'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Quick Stats Strip ── */}
        <View style={styles.statsStrip}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{user.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{user.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{ratingDisplay}</Text>
            <Text style={styles.statLabel}>Store Rating</Text>
          </View>
        </View>

        {/* ── Vendor Lead & Contact Analytics Card ── */}
        {(user.activeRole === 'vendor' || user.current_role === 'vendor' || user.role === 'vendor') && (
          <View style={styles.leadAnalyticsCard}>
            <View style={styles.leadAnalyticsHeader}>
              <Ionicons name="bar-chart" size={16} color={YELLOW} />
              <Text style={styles.leadAnalyticsTitle}>LEAD & CONTACT ANALYTICS</Text>
            </View>

            <View style={styles.leadGrid}>
              <View style={styles.leadGridItem}>
                <Ionicons name="call" size={16} color="#3B82F6" />
                <Text style={styles.leadVal}>{vendorAnalytics?.callsCount || 0}</Text>
                <Text style={styles.leadLbl}>Call Clicks</Text>
              </View>

              <View style={styles.leadGridItem}>
                <Ionicons name="logo-whatsapp" size={16} color="#22C55E" />
                <Text style={styles.leadVal}>{vendorAnalytics?.whatsappCount || 0}</Text>
                <Text style={styles.leadLbl}>WhatsApp</Text>
              </View>

              <View style={styles.leadGridItem}>
                <Ionicons name="chatbubble-ellipses" size={16} color={YELLOW} />
                <Text style={styles.leadVal}>{vendorAnalytics?.chatsCount || 0}</Text>
                <Text style={styles.leadLbl}>Chats</Text>
              </View>

              <View style={styles.leadGridItem}>
                <Ionicons name="mail" size={16} color="#EC407A" />
                <Text style={styles.leadVal}>{vendorAnalytics?.inquiriesCount || 0}</Text>
                <Text style={styles.leadLbl}>Inquiries</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Customer Hub Section ── */}
        <View style={styles.menuSectionCard}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionBar} />
            <Text style={styles.menuSectionHeader}>CUSTOMER HUB</Text>
          </View>

          {CUSTOMER_MENU.map((menu, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuRow, idx === CUSTOMER_MENU.length - 1 && styles.menuRowLast]}
              onPress={() => router.push(menu.route as any)}>
              <View style={styles.menuIconBox}>
                <Ionicons name={menu.icon as any} size={17} color={YELLOW} />
              </View>
              <Text style={styles.menuLabel}>{menu.label}</Text>
              <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.25)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Vendor Management Section ── */}
        {user.activeRole === 'vendor' && (
          <View style={styles.menuSectionCard}>
            <View style={styles.sectionLabelRow}>
              <View style={styles.sectionBar} />
              <Text style={styles.menuSectionHeader}>VENDOR MANAGEMENT</Text>
            </View>

            {VENDOR_MENU.map((menu, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.menuRow, idx === VENDOR_MENU.length - 1 && styles.menuRowLast]}
                onPress={() => router.push(menu.route as any)}>
                <View style={styles.menuIconBox}>
                  <Ionicons name={menu.icon as any} size={17} color={YELLOW} />
                </View>
                <Text style={styles.menuLabel}>{menu.label}</Text>
                <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.25)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Creator Studio Section ── */}
        {user.activeRole === 'creator' && (
          <View style={styles.menuSectionCard}>
            <View style={styles.sectionLabelRow}>
              <View style={styles.sectionBar} />
              <Text style={styles.menuSectionHeader}>CREATOR STUDIO</Text>
            </View>

            {CREATOR_MENU.map((menu, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.menuRow, idx === CREATOR_MENU.length - 1 && styles.menuRowLast]}
                onPress={() => router.push(menu.route as any)}>
                <View style={styles.menuIconBox}>
                  <Ionicons name={menu.icon as any} size={17} color={YELLOW} />
                </View>
                <Text style={styles.menuLabel}>{menu.label}</Text>
                <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.25)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Finance & Account Section ── */}
        <View style={styles.menuSectionCard}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionBar} />
            <Text style={styles.menuSectionHeader}>FINANCE & ACCOUNT</Text>
          </View>

          {(user.activeRole === 'creator' ? CREATOR_FINANCE_MENU : FINANCE_MENU).map((menu, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuRow, idx === (user.activeRole === 'creator' ? CREATOR_FINANCE_MENU : FINANCE_MENU).length - 1 && styles.menuRowLast]}
              onPress={() => router.push(menu.route as any)}>
              <View style={styles.menuIconBox}>
                <Ionicons name={menu.icon as any} size={17} color={YELLOW} />
              </View>
              <Text style={styles.menuLabel}>{menu.label}</Text>
              <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.25)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Log Out Button ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Log Out of Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BLACK },
  errorText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.sm, marginTop: 8 },
  retryBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 0,
    marginTop: 12,
  },
  retryText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },
  logoutIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { padding: Spacing.four, gap: Spacing.three },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    padding: Spacing.four,
    borderRadius: 0,
    gap: Spacing.three,
    borderWidth: 2,
    borderColor: YELLOW,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 0 },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 0,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: BLACK, fontSize: FontSize.lg, fontWeight: '900' },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 0,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BLACK,
  },

  userInfoCol: { flex: 1, gap: 4 },
  nameRoleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userName: { color: '#fff', fontSize: FontSize.base, fontWeight: '900', flex: 1, marginRight: 6 },
  userEmail: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  badgePillsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 0,
    gap: 4,
  },
  kycDot: { width: 4, height: 4, borderRadius: 0, backgroundColor: BLACK },
  kycText: { color: BLACK, fontSize: 9, fontWeight: '900' },
  planBadge: {
    backgroundColor: BLACK,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
  },
  planText: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900' },

  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DARK_CARD,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: BORDER },

  menuSectionCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionBar: { width: 3, height: 10, borderRadius: 0, backgroundColor: YELLOW },
  menuSectionHeader: {
    color: YELLOW,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuIconBox: {
    width: 30,
    height: 30,
    borderRadius: 0,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 14,
    borderRadius: 0,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  logoutBtnText: { color: '#EF4444', fontSize: FontSize.xs, fontWeight: '900' },

  leadAnalyticsCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    gap: 12,
  },
  leadAnalyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
  },
  leadAnalyticsTitle: {
    color: YELLOW,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  leadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leadGridItem: {
    alignItems: 'center',
    backgroundColor: BLACK,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 4,
  },
  leadVal: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  leadLbl: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
  },
});
