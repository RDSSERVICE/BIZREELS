/**
 * Profile Screen — Light Theme & Warm Gold Bento Grid
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
import { FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCurrentUserProfile } from '@/features/auth/queries';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/utils/image';

const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_COLOR = '#F6F4EE';
const CARD_BG = '#FBF9F5';
const BORDER = '#E5E0D4';
const TEXT_MAIN = '#1E1B18';
const TEXT_MUTED = '#6E675F';
const EMERALD = '#10B981';

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
          api.get('/analytics/vendor-lead-summary').catch(() => ({ data: {} })),
          api.get('/vendor/analytics/overview?range=30d').catch(() => ({ data: {} })),
        ])
          .then(([leadsRes, leadSummaryRes, overviewRes]) => {
            const leads = leadsRes.data?.data || leadsRes.data || {};
            const summary = leadSummaryRes.data?.data || leadSummaryRes.data || {};
            const rawOverview = overviewRes.data?.data || overviewRes.data || {};
            const kpis = rawOverview.kpis || rawOverview || {};

            const calls = Math.max(Number(leads.callsCount || 0), Number(summary.callsCount || 0), Number(kpis.phoneCalls || 0));
            const wa = Math.max(Number(leads.whatsappCount || 0), Number(summary.whatsappCount || 0), Number(kpis.whatsappClicks || 0));
            const chats = Math.max(Number(leads.chatsCount || 0), Number(summary.chatsCount || 0), Number(summary.chatThreadsCount || 0), Number(kpis.chatsCount || 0));
            const inquiries = Math.max(Number(leads.inquiriesCount || 0), Number(summary.inquiriesCount || 0), Number(summary.directInquiriesCount || 0), chats);

            setVendorAnalytics({
              callsCount: calls,
              whatsappCount: wa,
              chatsCount: chats,
              inquiriesCount: inquiries,
              savedReelsCount: Number(leads.savedReelsCount || kpis.saves || 0),
              revenue: Number(kpis.revenue || kpis.total_revenue || 0),
              views: Number(kpis.views || 0),
              ordersCount: Number(kpis.total_orders || kpis.ordersCount || 0),
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
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (authStatus === 'unauthed' || !user) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.unauthIconBox}>
          <Ionicons name="person-circle-outline" size={48} color={GOLD} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '900', color: TEXT_MAIN, marginTop: 16 }}>Welcome to BizReels</Text>
        <Text style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginHorizontal: 32, marginTop: 8, marginBottom: 24, lineHeight: 18 }}>
          Sign in to access your profile, track your orders, view saved reels, and manage your account preferences.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: ESPRESSO, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 }}
          onPress={() => router.push('/(auth)/login')}>
          <Text style={{ color: GOLD, fontWeight: '900', fontSize: 16 }}>Log In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={GOLD} />
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
    { label: 'Notifications & Platform Alerts', route: '/notifications', icon: 'notifications-outline' },
    { label: 'My Orders', route: '/orders', icon: 'cart-outline' },
    { label: 'My Activities & History', route: '/activities', icon: 'pulse-outline' },
    { label: 'Edit Account & Profile Settings', route: '/customer/settings', icon: 'person-outline' },
    { label: 'Manage Selected Interests & Preferences', route: '/customer/choose-interests', icon: 'options-outline' },
    { label: 'Chat & Messages Inbox', route: '/messages', icon: 'chatbubble-ellipses-outline' },
    { label: 'Saved Reels & Bookmarks', route: '/saved-reels', icon: 'bookmark-outline' },
  ];

  const VENDOR_MENU = [
    { label: 'Notifications & Alerts', route: '/notifications', icon: 'notifications-outline' },
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
    { label: 'Notifications & Alerts', route: '/notifications', icon: 'notifications-outline' },
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
            <Ionicons name="log-in-outline" size={18} color={GOLD} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.guestCard}>
            <View style={styles.guestAvatarCircle}>
              <Ionicons name="person-outline" size={36} color={GOLD} />
            </View>
            <Text style={styles.guestTitle}>Welcome to BizReels</Text>
            <Text style={styles.guestSub}>
              Log in to message sellers directly, place orders, save favorite reels &amp; manage your store profile.
            </Text>

            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => router.push('/(auth)/login')}>
              <Ionicons name="log-in-outline" size={18} color={GOLD} />
              <Text style={styles.guestPrimaryText}>Log In to Your Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestSecondaryBtn}
              onPress={() => router.push('/(auth)/register')}>
              <Ionicons name="person-add-outline" size={18} color={TEXT_MAIN} />
              <Text style={styles.guestSecondaryText}>Create Free Account</Text>
            </TouchableOpacity>
          </View>

          {/* Public Information Links */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>EXPLORE BIZREELS</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/home')}>
              <Ionicons name="home-outline" size={20} color={GOLD} />
              <Text style={styles.menuItemLabel}>Home Marketplace</Text>
              <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)')}>
              <Ionicons name="videocam-outline" size={20} color={GOLD} />
              <Text style={styles.menuItemLabel}>Watch Video Reels</Text>
              <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/search' as any)}>
              <Ionicons name="search-outline" size={20} color={GOLD} />
              <Text style={styles.menuItemLabel}>Search Products &amp; Sellers</Text>
              <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
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
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={GOLD} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={GOLD} />
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
            tintColor={GOLD}
            colors={[GOLD]}
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
              <Ionicons name="checkmark" size={8} color={ESPRESSO} />
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
                const statusColor = isKycApproved ? EMERALD : GOLD;

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
              <Ionicons name="bar-chart" size={16} color={GOLD} />
              <Text style={styles.leadAnalyticsTitle}>LEAD &amp; CONTACT ANALYTICS</Text>
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
                <Ionicons name="chatbubble-ellipses" size={16} color={GOLD} />
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
                  MY FEED INTERESTS &amp; PREFERENCES ({groupedInterests.length})
                </Text>
                <TouchableOpacity onPress={() => router.push('/customer/choose-interests' as any)}>
                  <Text style={{ color: GOLD, fontSize: 11, fontWeight: '900' }}>Edit / Manage ›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {groupedInterests.length > 0 ? (
              <View style={styles.interestsGroupWrap}>
                {groupedInterests.map((item, idx) => (
                  <View key={idx} style={styles.interestGroupCard}>
                    <View style={styles.interestCategoryHeader}>
                      <Ionicons name="folder-outline" size={13} color={GOLD} />
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
                      <Text style={styles.allSubLabel}>All Subcategories &amp; Related Feed Items</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyInterestsBox}>
                <Ionicons name="heart-dislike-outline" size={28} color={GOLD} />
                <Text style={styles.emptyInterestsTitle}>No Preferences Configured Yet</Text>
                <Text style={styles.emptyInterestsSub}>
                  Select your top categories to receive personalized video reels, local seller offers, and custom deals.
                </Text>
                <TouchableOpacity
                  style={styles.chooseInterestsBtn}
                  onPress={() => router.push('/customer/choose-interests' as any)}>
                  <Ionicons name="options-outline" size={14} color={GOLD} />
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
                  <Ionicons name={menu.icon as any} size={17} color={GOLD} />
                </View>
                <Text style={styles.menuLabel}>{menu.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={TEXT_MUTED} />
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
                  <Ionicons name={menu.icon as any} size={17} color={GOLD} />
                </View>
                <Text style={styles.menuLabel}>{menu.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={TEXT_MUTED} />
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
                  <Ionicons name={menu.icon as any} size={17} color={GOLD} />
                </View>
                <Text style={styles.menuLabel}>{menu.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={TEXT_MUTED} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Finance & Account Section (Vendor & Creator Modes Only) ── */}
        {(activeRole === 'vendor' || activeRole === 'creator') && (
          <View style={styles.menuSectionCard}>
            <View style={styles.sectionLabelRow}>
              <View style={styles.sectionBar} />
              <Text style={styles.menuSectionHeader}>FINANCE &amp; ACCOUNT</Text>
            </View>

            {(activeRole === 'creator' ? CREATOR_FINANCE_MENU : FINANCE_MENU).map((menu, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.menuRow, idx === (activeRole === 'creator' ? CREATOR_FINANCE_MENU : FINANCE_MENU).length - 1 && styles.menuRowLast]}
                onPress={() => router.push(menu.route as any)}>
                <View style={styles.menuIconBox}>
                  <Ionicons name={menu.icon as any} size={17} color={GOLD} />
                </View>
                <Text style={styles.menuLabel}>{menu.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={TEXT_MUTED} />
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
  container: { flex: 1, backgroundColor: BG_COLOR },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG_COLOR },
  unauthIconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 154, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.2)',
  },
  errorText: { color: TEXT_MUTED, fontSize: FontSize.sm, marginTop: 8 },
  retryBtn: {
    backgroundColor: ESPRESSO,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: { color: GOLD, fontSize: FontSize.xs, fontWeight: '900' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD_BG,
  },
  headerTitle: { color: TEXT_MAIN, fontSize: FontSize.md, fontWeight: '900' },
  logoutIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { padding: Spacing.four, gap: Spacing.three },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
    ...Shadows.sm,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ESPRESSO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: GOLD, fontSize: FontSize.lg, fontWeight: '900' },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: CARD_BG,
  },

  userInfoCol: { flex: 1, gap: 4 },
  nameRoleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userName: { color: TEXT_MAIN, fontSize: FontSize.base, fontWeight: '900', flex: 1, marginRight: 6 },
  userEmail: { color: TEXT_MUTED, fontSize: 11 },

  badgePillsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  kycDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: EMERALD },
  kycText: { color: EMERALD, fontSize: 9, fontWeight: '900' },
  planBadge: {
    backgroundColor: 'rgba(217, 154, 61, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.3)',
  },
  planText: { color: GOLD, fontSize: 9, fontWeight: '900' },

  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    ...Shadows.sm,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { color: GOLD, fontSize: FontSize.sm, fontWeight: '900' },
  statLabel: { color: TEXT_MUTED, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: BORDER },

  menuSectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
    borderColor: BORDER,
    ...Shadows.sm,
  },
  interestsGroupWrap: {
    gap: 8,
    marginTop: 6,
    paddingTop: 4,
  },
  interestGroupCard: {
    backgroundColor: BG_COLOR,
    borderRadius: 12,
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
    color: TEXT_MAIN,
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
    backgroundColor: 'rgba(217, 154, 61, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subPillText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
  },
  allSubLabel: {
    color: TEXT_MUTED,
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
    backgroundColor: BG_COLOR,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  interestPillText: {
    color: TEXT_MAIN,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyInterestsBox: {
    backgroundColor: BG_COLOR,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  emptyInterestsTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  emptyInterestsSub: {
    color: TEXT_MUTED,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  chooseInterestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ESPRESSO,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  chooseInterestsBtnText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '900',
  },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionBar: { width: 3, height: 10, borderRadius: 2, backgroundColor: GOLD },
  menuSectionHeader: {
    color: GOLD,
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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(217, 154, 61, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutBtnText: { color: '#EF4444', fontSize: FontSize.xs, fontWeight: '900' },

  leadAnalyticsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    gap: 12,
    ...Shadows.sm,
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
    color: GOLD,
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
    backgroundColor: BG_COLOR,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 4,
  },
  leadVal: {
    color: TEXT_MAIN,
    fontSize: 14,
    fontWeight: '900',
  },
  leadLbl: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  guestCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: Spacing.five,
    alignItems: 'center',
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: BORDER,
    ...Shadows.sm,
  },
  guestAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(217, 154, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.2)',
  },
  guestTitle: {
    color: TEXT_MAIN,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  guestSub: {
    color: TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  guestPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ESPRESSO,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    gap: 8,
    marginBottom: 10,
  },
  guestPrimaryText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '900',
  },
  guestSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  guestSecondaryText: {
    color: TEXT_MAIN,
    fontSize: 13,
    fontWeight: '700',
  },
  menuSection: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
    ...Shadows.sm,
  },
  menuSectionTitle: {
    color: GOLD,
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
    color: TEXT_MAIN,
    fontSize: 13,
    fontWeight: '600',
  },
});
