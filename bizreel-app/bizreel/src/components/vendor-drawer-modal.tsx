/**
 * Vendor Hamburger Side Drawer Modal — Mobile Application
 * Classic Brutalist Yellow & Black Palette.
 */

import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useNotifications } from '@/features/notifications/queries';

interface DrawerItem {
  title: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

interface DrawerSection {
  key: string;
  title: string;
  items: DrawerItem[];
}

interface VendorDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VendorDrawerModal({ isOpen, onClose }: VendorDrawerModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  // Collapsible section state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    MAIN: false,
    BUSINESS: false,
    FINANCE: false,
  });

  function toggleSection(key: string) {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleNavigate(route: string) {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  }

  function handleLogout() {
    onClose();
    Alert.alert('Log Out', 'Are you sure you want to log out of Vendor Portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const isVendor = user?.activeRole === 'vendor';
  const displayName = isVendor
    ? (user as any)?.vendorProfile?.storeName || (user as any)?.vendorProfile?.businessName || user?.name || 'Vendor Store'
    : user?.name || 'Customer';
  const displayEmail = user?.email || 'user@bizreels.com';
  const subtitleRole = isVendor ? 'VENDOR PORTAL' : 'CUSTOMER MENU';

  const CUSTOMER_SECTIONS: DrawerSection[] = [
    {
      key: 'MAIN',
      title: 'CUSTOMER NAVIGATION',
      items: [
        { title: 'Home Marketplace', route: '/(tabs)/home', icon: 'home-outline' },
        { title: 'Explore & Search', route: '/(tabs)/search', icon: 'search-outline' },
        { title: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
        { title: 'Chat & Inbox', route: '/messages', icon: 'chatbubble-ellipses-outline' },
        { title: 'My Inquiries & Quotes', route: '/inquiries', icon: 'mail-outline' },
        { title: 'My Orders', route: '/orders', icon: 'cart-outline' },
        { title: 'Saved Items & Reels', route: '/saved-reels', icon: 'bookmark-outline' },
        { title: 'My Profile', route: '/(tabs)/profile', icon: 'person-outline' },
      ],
    },
  ];

  const VENDOR_SECTIONS: DrawerSection[] = [
    {
      key: 'MAIN',
      title: 'MAIN NAVIGATION',
      items: [
        { title: 'Dashboard', route: '/vendor/dashboard', icon: 'grid-outline' },
        { title: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
        { title: 'My Listings', route: '/vendor/listings', icon: 'cube-outline' },
        { title: 'Offers & Discounts', route: '/vendor/offers', icon: 'pricetags-outline' },
        { title: 'Reels & AI Ads', route: '/vendor/reels', icon: 'videocam-outline' },
        { title: 'Leads / Enquiries', route: '/inquiries', icon: 'mail-outline' },
        { title: 'Order Requests', route: '/vendor/orders', icon: 'cart-outline' },
        { title: 'Chat / Inbox', route: '/messages', icon: 'chatbubble-ellipses-outline' },
      ],
    },
    {
      key: 'BUSINESS',
      title: 'BUSINESS & GROWTH',
      items: [
        { title: 'Business Profile', route: '/vendor/profile', icon: 'person-outline' },
        { title: 'Onboarding Details', route: '/vendor/onboarding', icon: 'document-text-outline' },
        { title: 'Verification Center', route: '/vendor/verification', icon: 'shield-checkmark-outline', badge: 'VERIFIED' },
        { title: 'Analytics', route: '/vendor/analytics', icon: 'stats-chart-outline' },
        { title: 'Hire Creator', route: '/vendor/hire-creator', icon: 'people-outline' },
        { title: 'Refer & Earn', route: '/vendor/referrals', icon: 'person-add-outline' },
        { title: 'Reviews', route: '/vendor/reviews', icon: 'star-outline' },
        { title: 'Followers', route: '/vendor/followers', icon: 'heart-outline' },
      ],
    },
    {
      key: 'FINANCE',
      title: 'FINANCE & ACCOUNT',
      items: [
        { title: 'Subscription Plan', route: '/vendor/subscription', icon: 'card-outline' },
        { title: 'Vendor Wallet & Credits', route: '/vendor/wallet', icon: 'wallet-outline' },
        { title: 'Store Settings', route: '/vendor/settings', icon: 'settings-outline' },
      ],
    },
  ];

  const CREATOR_SECTIONS: DrawerSection[] = [
    {
      key: 'OVERVIEW',
      title: 'OVERVIEW',
      items: [
        { title: 'Dashboard', route: '/creator/dashboard', icon: 'grid-outline' },
        { title: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
        { title: 'Settings', route: '/creator/settings', icon: 'settings-outline' },
      ],
    },
    {
      key: 'PROFILE_WORK',
      title: 'PROFILE & WORK',
      items: [
        { title: 'Profile', route: '/creator/profile', icon: 'person-outline' },
        { title: 'Onboarding Details', route: '/creator/onboarding', icon: 'document-text-outline' },
        { title: 'Verification Center', route: '/creator/verification', icon: 'shield-checkmark-outline', badge: 'VERIFIED' },
        { title: 'Portfolio', route: '/creator/portfolio', icon: 'film-outline' },
        { title: 'Pricing Rates', route: '/creator/pricing', icon: 'pricetag-outline' },
        { title: 'Availability', route: '/creator/availability', icon: 'calendar-outline' },
      ],
    },
    {
      key: 'PROJECTS_EARNINGS',
      title: 'PROJECTS & EARNINGS',
      items: [
        { title: 'My Orders', route: '/creator/orders', icon: 'briefcase-outline' },
        { title: 'Chats', route: '/messages', icon: 'chatbubbles-outline' },
        { title: 'Reviews', route: '/creator/reviews', icon: 'star-outline' },
        { title: 'Analytics', route: '/creator/analytics', icon: 'stats-chart-outline' },
      ],
    },
    {
      key: 'FINANCE_ACCOUNT',
      title: 'FINANCE & ACCOUNT',
      items: [
        { title: 'Subscription', route: '/creator/subscription', icon: 'card-outline' },
        { title: 'Wallet & Earnings', route: '/creator/wallet', icon: 'wallet-outline' },
      ],
    },
  ];

  const activeRole = user?.activeRole || user?.current_role || (isVendor ? 'vendor' : 'customer');
  const NAV_SECTIONS = activeRole === 'creator' ? CREATOR_SECTIONS : activeRole === 'vendor' ? VENDOR_SECTIONS : CUSTOMER_SECTIONS;

  const { data: notificationsList = [] } = useNotifications(activeRole);
  const unreadNotificationsCount = notificationsList.filter((n) => !n.isRead).length;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Left Side Drawer Container */}
        <View style={[styles.drawerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>B</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>
                  Biz<Text style={{ color: '#D99A3D' }}>Reels</Text>
                </Text>
                <Text style={styles.brandSubtitle}>{subtitleRole}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {NAV_SECTIONS.map((sec) => {
              const isCollapsed = collapsedSections[sec.key];

              return (
                <View key={sec.key} style={styles.sectionBlock}>
                  <TouchableOpacity
                    style={styles.sectionHeaderRow}
                    onPress={() => toggleSection(sec.key)}>
                    <Text style={styles.sectionTitle}>{sec.title}</Text>
                    <Ionicons
                      name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                      size={12}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>

                  {!isCollapsed && (
                    <View style={styles.itemsList}>
                      {sec.items.map((item, idx) => {
                        const isActive = pathname === item.route;

                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[styles.menuItemRow, isActive && styles.menuItemRowActive]}
                            onPress={() => handleNavigate(item.route)}>
                            <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                              <Ionicons
                                name={item.icon as any}
                                size={13}
                                color="#1A1A1A"
                              />
                            </View>

                            <Text style={[styles.menuItemTitle, isActive && styles.menuItemTitleActive]}>
                              {item.title}
                            </Text>

                            {item.badge && (
                              <View style={styles.itemBadge}>
                                <Text style={styles.itemBadgeText}>
                                  {item.badge}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* User Profile Footer — 1:1 Web Layout */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name={user ? "person" : "person-outline"} size={16} color="#D99A3D" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {!user ? 'Welcome to BizReels' : displayName}
                  </Text>
                  {isVendor && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#D99A3D" />
                    </View>
                  )}
                </View>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {!user ? 'Sign in to access all features' : displayEmail}
                </Text>
              </View>
            </View>

            {!user ? (
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={[styles.logoutBtn, { backgroundColor: '#241B15', borderColor: '#241B15' }]}
                  onPress={() => handleNavigate('/(auth)/login')}>
                  <Ionicons name="log-in-outline" size={15} color="#D99A3D" />
                  <Text style={[styles.logoutText, { color: '#D99A3D' }]}>Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.logoutBtn, { backgroundColor: '#F8F4EC', borderColor: '#E3DCCB' }]}
                  onPress={() => handleNavigate('/(auth)/register')}>
                  <Ionicons name="person-add-outline" size={15} color="#1A1A1A" />
                  <Text style={[styles.logoutText, { color: '#1A1A1A' }]}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={15} color="#EF4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  backdropTouch: { flex: 1 },
  drawerContainer: {
    width: '80%',
    maxWidth: 290,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#E3DCCB',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E3DCCB',
    marginBottom: 8,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#241B15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D99A3D',
  },
  logoText: { color: '#D99A3D', fontSize: FontSize.md, fontWeight: '900' },
  brandTitle: { color: '#1A1A1A', fontSize: FontSize.sm, fontWeight: '900' },
  brandSubtitle: { color: '#D99A3D', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },

  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F8F4EC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3DCCB',
  },

  scrollContent: { flex: 1 },

  sectionBlock: { marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  sectionTitle: { color: '#94A3B8', fontSize: 9.5, fontWeight: '900', letterSpacing: 1 },

  itemsList: { gap: 3 },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuItemRowActive: {
    backgroundColor: '#241B15',
    borderColor: '#241B15',
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#F8F4EC',
    borderWidth: 1,
    borderColor: '#E3DCCB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: '#D99A3D',
    borderColor: '#D99A3D',
  },
  menuItemTitle: {
    flex: 1,
    color: '#334155',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  menuItemTitleActive: {
    color: '#D99A3D',
    fontWeight: '900',
  },
  itemBadge: {
    backgroundColor: '#D99A3D',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemBadgeText: { color: '#1A1A1A', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 },

  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E3DCCB',
    gap: 8,
    backgroundColor: '#F8F4EC',
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#241B15',
    borderWidth: 2,
    borderColor: '#D99A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileName: { color: '#1A1A1A', fontSize: FontSize.xs, fontWeight: '900', flex: 1 },
  verifiedBadge: { marginLeft: 2 },
  profileEmail: { color: '#64748B', fontSize: 10 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  logoutText: { color: '#EF4444', fontSize: FontSize.xs, fontWeight: '800' },
});
