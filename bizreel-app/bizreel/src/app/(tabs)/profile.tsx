/**
 * Profile Screen — Classic Brutalist Yellow & Black palette
 * Minimalistic, clean, professional.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
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
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/utils/image';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, status: authStatus } = useAuth();

  const { data: user, isLoading, isError, refetch, isRefetching } = useCurrentUserProfile();

  const [userInterests, setUserInterests] = useState<Array<{ category: string; subcategory?: string | null }>>([]);

  const [vendorAnalytics, setVendorAnalytics] = useState<{
    callsCount: number;
    whatsappCount: number;
    chatsCount: number;
    inquiriesCount: number;
    savedReelsCount: number;
    revenue: number;
    views: number;
    ordersCount: number;
  } | null>(null);

  useEffect(() => {
    const u = user as any;
    if (u) {
      const rawInterests =
        u.customerProfile?.interests ||
        u.interests ||
        u.customer_interests ||
        [];
      
      const parsed: Array<{ category: string; subcategory?: string | null }> = Array.isArray(rawInterests)
        ? rawInterests.map((i: any) => {
            if (typeof i === 'string') return { category: i, subcategory: null };
            return { category: i.category || i.name || 'General', subcategory: i.subcategory || null };
          }).filter((i) => Boolean(i.category))
        : [];

      if (parsed.length > 0) {
        setUserInterests(parsed);
      }

      api.get('/v1/users/me/interests')
        .then((res) => {
          const items = res.data?.interests || res.data?.data?.interests || [];
          if (Array.isArray(items) && items.length > 0) {
            const list = items.map((i: any) => {
              if (typeof i === 'string') return { category: i, subcategory: null };
              return { category: i.category || i.name || 'General', subcategory: i.subcategory || null };
            }).filter((i) => Boolean(i.category));
            setUserInterests(list);
          }
        })
        .catch(() => null);

      if (u?.activeRole === 'vendor' || u?.current_role === 'vendor' || u?.role === 'vendor') {
        Promise.all([
          api.get('/analytics/vendor').catch(() => ({ data: {} })),
          api.get('/vendor/analytics/overview?range=30d').catch(() => ({ data: {} })),
        ])
          .then(([leadsRes, overviewRes]) => {
            const leads = leadsRes.data?.data || leadsRes.data || {};
            const overview = overviewRes.data?.data || overviewRes.data || {};

            setVendorAnalytics({
              callsCount: leads.callsCount || overview.phoneCalls || 0,
              whatsappCount: leads.whatsappCount || overview.whatsappClicks || 0,
              chatsCount: leads.chatsCount || overview.uniqueChatters || 0,
              inquiriesCount: leads.inquiriesCount || overview.inquiriesCount || 0,
              savedReelsCount: leads.savedReelsCount || overview.watchersCount || 0,
              revenue: overview.revenue || 0,
              views: overview.views || 0,
              ordersCount: overview.ordersCount || 0,
            });
          })
          .catch((err) => console.warn('Failed to load vendor analytics', err));
      }
    }
  }, [user]);

  const groupedInterests = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of userInterests) {
      if (!map.has(item.category)) {
        map.set(item.category, []);
      }
      if (item.subcategory) {
        const existing = map.get(item.category)!;
        if (!existing.includes(item.subcategory)) {
          existing.push(item.subcategory);
        }
      }
    }
    return Array.from(map.entries()).map(([category, subs]) => ({ category, subs }));
  }, [userInterests]);

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={YELLOW} />
      </View>
    );
  }

  if (authStatus === 'unauthed' || !user) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="person-circle-outline" size={80} color={YELLOW} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16 }}>Welcome to BizReels</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginHorizontal: 32, marginTop: 8, marginBottom: 24, lineHeight: 18 }}>
          Sign in to access your profile, track your orders, view saved reels, and manage your account preferences.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: YELLOW, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 }}
          onPress={() => router.push('/(auth)/login')}>
          <Text style={{ color: BLACK, fontWeight: '700', fontSize: 16 }}>Log In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isError) {
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

  const rawAvatar =
    (user as any).avatarUrl ||
    user.profile_pic ||
    (user as any).vendorProfile?.avatarUrl ||
    (user as any).vendorProfile?.logo;
  const avatarUrl = resolveImageUrl(rawAvatar);
  const initials = user.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : 'U';

  const ratingDisplay = user.rating_count > 0 ? `${user.rating_avg.toFixed(1)} ★` : '4.9 ★';
  const activeRole = (user as any)?.activeRole || (user as any)?.current_role || 'customer';

  const CUSTOMER_MENU = [
    { label: 'My Orders', route: '/orders', icon: 'cart-outline' },
    { label: 'My Activities & History', route: '/activities', icon: 'pulse-outline' },
    { label: 'Edit Account & Profile Settings', route: '/customer/settings', icon: 'person-outline' },
    { label: 'Manage Selected Interests & Preferences', route: '/customer/choose-interests', icon: 'options-outline' },
    { label: 'Chat & Messages Inbox', route: '/messages', icon: 'chatbubble-ellipses-outline' },
    { label: 'Saved Reels & Bookmarks', route: '/saved-reels', icon: 'bookmark-outline' },
  ];

  const VENDOR_MENU = [
    { label: 'Edit Vendor Business Profile', route: '/vendor/settings', icon: 'storefront-outline' },
    { label: 'Store Dashboard & Analytics', route: '/vendor/dashboard', icon: 'grid-outline' },
    { label: 'Hire Content Creators', route: '/vendor/hire-creator', icon: 'people-outline' },
    { label: 'Video Reels & AI Ads', route: '/vendor/reels', icon: 'videocam-outline' },
    { label: 'Product & Service Catalog', route: '/vendor/listings', icon: 'cube-outline' },
    { label: 'Customer Orders & Requests', route: '/vendor/orders', icon: 'cart-outline' },
    { label: 'Chat & Inbox Messages', route: '/messages', icon: 'chatbubble-ellipses-outline' },
    { label: 'KYC Business Verification', route: '/vendor/verification', icon: 'shield-checkmark-outline' },
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

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.logoutIconBtn}
            onPress={() => router.push('/(auth)/login')}>
            <Ionicons name="log-in-outline" size={18} color={YELLOW} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.guestCard}>
            <View style={styles.guestAvatarCircle}>
              <Ionicons name="person-outline" size={36} color={YELLOW} />
            </View>
            <Text style={styles.guestTitle}>Welcome to BizReels</Text>
            <Text style={styles.guestSub}>
              Log in to message sellers directly, place orders, save favorite reels & manage your store profile.
            </Text>

            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => router.push('/(auth)/login')}>
              <Ionicons name="log-in-outline" size={18} color={BLACK} />
              <Text style={styles.guestPrimaryText}>Log In to Your Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestSecondaryBtn}
              onPress={() => router.push('/(auth)/register')}>
              <Ionicons name="person-add-outline" size={18} color={YELLOW} />
              <Text style={styles.guestSecondaryText}>Create Free Account</Text>
            </TouchableOpacity>
          </View>

          {/* Public Information Links */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>EXPLORE BIZREELS</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/home')}>
              <Ionicons name="home-outline" size={20} color={YELLOW} />
              <Text style={styles.menuItemLabel}>Home Marketplace</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)')}>
              <Ionicons name="videocam-outline" size={20} color={YELLOW} />
              <Text style={styles.menuItemLabel}>Watch Video Reels</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/search' as any)}>
              <Ionicons name="search-outline" size={20} color={YELLOW} />
              <Text style={styles.menuItemLabel}>Search Products & Sellers</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

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
              {(() => {
                const uData = (user as any) || {};
                const isKycApproved =
                  uData.kyc_status === 'approved' ||
                  uData.kyc_status === 'verified' ||
                  uData.vendorProfile?.verificationStatus === 'approved' ||
                  uData.isVerified;
                const statusLabel = isKycApproved
                  ? 'KYC VERIFIED'
                  : uData.kyc_status === 'pending'
                  ? 'KYC PENDING'
                  : 'UNVERIFIED';
                const statusColor = isKycApproved ? '#10B981' : '#F59E0B';

                return (
                  <View style={[styles.kycBadge, { borderColor: statusColor }]}>
                    <View style={[styles.kycDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.kycText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                );
              })()}
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
        {(((user as any).activeRole === 'vendor' || (user as any).current_role === 'vendor' || (user as any).role === 'vendor')) && (
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

        {/* ── Selected Interests & Feed Preferences (Customer Mode Only) ── */}
        {activeRole === 'customer' && (
          <View style={styles.menuSectionCard}>
            <View style={styles.sectionLabelRow}>
              <View style={styles.sectionBar} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                <Text style={styles.menuSectionHeader}>
                  MY FEED INTERESTS & PREFERENCES ({groupedInterests.length})
                </Text>
                <TouchableOpacity onPress={() => router.push('/customer/choose-interests' as any)}>
                  <Text style={{ color: YELLOW, fontSize: 11, fontWeight: '900' }}>Edit / Manage ›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {groupedInterests.length > 0 ? (
              <View style={styles.interestsGroupWrap}>
                {groupedInterests.map((item, idx) => (
                  <View key={idx} style={styles.interestGroupCard}>
                    <View style={styles.interestCategoryHeader}>
                      <Ionicons name="folder-outline" size={13} color={YELLOW} />
                      <Text style={styles.interestCategoryName}>{item.category}</Text>
                    </View>

                    {item.subs.length > 0 ? (
                      <View style={styles.subPillsWrap}>
                        {item.subs.map((sub, sIdx) => (
                          <View key={sIdx} style={styles.subPillChip}>
                            <Text style={styles.subPillText}>• {sub}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.allSubLabel}>All Subcategories & Related Feed Items</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyInterestsBox}>
                <Ionicons name="heart-dislike-outline" size={28} color={YELLOW} />
                <Text style={styles.emptyInterestsTitle}>No Preferences Configured Yet</Text>
                <Text style={styles.emptyInterestsSub}>
                  Select your top categories to receive personalized video reels, local seller offers, and custom deals.
                </Text>
                <TouchableOpacity
                  style={styles.chooseInterestsBtn}
                  onPress={() => router.push('/customer/choose-interests' as any)}>
                  <Ionicons name="options-outline" size={14} color={BLACK} />
                  <Text style={styles.chooseInterestsBtnText}>+ Select Your Interests</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Customer Hub Section (Customer Mode Only) ── */}
        {activeRole === 'customer' && (
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
        )}

        {/* ── Vendor Management Section (Vendor Mode Only) ── */}
        {activeRole === 'vendor' && (
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

        {/* ── Creator Studio Section (Creator Mode Only) ── */}
        {activeRole === 'creator' && (
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

        {/* ── Finance & Account Section (Vendor & Creator Modes Only) ── */}
        {(activeRole === 'vendor' || activeRole === 'creator') && (
          <View style={styles.menuSectionCard}>
            <View style={styles.sectionLabelRow}>
              <View style={styles.sectionBar} />
              <Text style={styles.menuSectionHeader}>FINANCE & ACCOUNT</Text>
            </View>

            {(activeRole === 'creator' ? CREATOR_FINANCE_MENU : FINANCE_MENU).map((menu, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.menuRow, idx === (activeRole === 'creator' ? CREATOR_FINANCE_MENU : FINANCE_MENU).length - 1 && styles.menuRowLast]}
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
  interestsGroupWrap: {
    gap: 8,
    marginTop: 6,
    paddingTop: 4,
  },
  interestGroupCard: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    gap: 4,
  },
  interestCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interestCategoryName: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  subPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  subPillChip: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subPillText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '700',
  },
  allSubLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  interestsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    paddingTop: 4,
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  interestPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyInterestsBox: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  emptyInterestsTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  emptyInterestsSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  chooseInterestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  chooseInterestsBtnText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
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
  guestCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 16,
    padding: Spacing.five,
    alignItems: 'center',
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: BORDER,
  },
  guestAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  guestTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  guestSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  guestPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    gap: 8,
    marginBottom: 10,
  },
  guestPrimaryText: {
    color: BLACK,
    fontSize: 13,
    fontWeight: '900',
  },
  guestSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: YELLOW,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    gap: 8,
  },
  guestSecondaryText: {
    color: YELLOW,
    fontSize: 13,
    fontWeight: '700',
  },
  menuSection: {
    backgroundColor: DARK_CARD,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
  },
  menuSectionTitle: {
    color: YELLOW,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  menuItemLabel: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
