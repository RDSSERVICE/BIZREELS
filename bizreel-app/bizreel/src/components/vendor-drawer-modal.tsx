/**
 * Vendor Hamburger Side Drawer Modal — Mobile Application
 * Aligned with Frontend VendorLayout menu structure (Warm Editorial Bento style).
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
    PORTALS: false,
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

  const vendorName = (user as any)?.vendorProfile?.storeName || (user as any)?.vendorProfile?.businessName || user?.name || 'Vendor Store';
  const vendorEmail = user?.email || 'vendor@bizreels.com';

  const NAV_SECTIONS = [
    {
      key: 'MAIN',
      title: 'MAIN NAVIGATION',
      items: [
        { title: 'Dashboard', route: '/vendor/dashboard', icon: 'grid', color: '#38BDF8' },
        { title: 'My Listings', route: '/vendor/listings', icon: 'cube', color: '#F59E0B' },
        { title: 'Reels & AI Ads', route: '/vendor/reels', icon: 'videocam', color: '#EC4899' },
        { title: 'Leads / Enquiries', route: '/inquiries', icon: 'mail', color: '#8B5CF6' },
        { title: 'Order Requests', route: '/vendor/orders', icon: 'cart', color: '#10B981' },
        { title: 'Chat / Inbox', route: '/messages', icon: 'chatbubble-ellipses', color: '#6366F1' },
      ],
    },
    {
      key: 'PORTALS',
      title: 'PORTALS & FEEDS',
      items: [
        { title: 'Customer Feed', route: '/(tabs)/home', icon: 'tv', color: '#38BDF8' },
        { title: 'Creator Portal', route: '/vendor/hire-creator', icon: 'film', color: '#EC4899' },
      ],
    },
    {
      key: 'BUSINESS',
      title: 'BUSINESS & GROWTH',
      items: [
        { title: 'Business Profile', route: '/vendor/profile', icon: 'person', color: '#3B82F6' },
        { title: 'Onboarding Details', route: '/vendor/onboarding', icon: 'document-text', color: '#14B8A6' },
        { title: 'Verification Center', route: '/vendor/verification', icon: 'shield-checkmark', color: '#10B981', badge: 'VERIFIED' },
        { title: 'Analytics', route: '/vendor/analytics', icon: 'analytics', color: '#F43F5E' },
        { title: 'Refer & Earn', route: '/vendor/referrals', icon: 'person-add', color: '#EAB308' },
        { title: 'Hire Creator', route: '/vendor/hire-creator', icon: 'people', color: '#A855F7' },
        { title: 'Reviews', route: '/vendor/reviews', icon: 'star', color: '#F59E0B' },
        { title: 'Followers', route: '/vendor/followers', icon: 'heart', color: '#EC4899' },
      ],
    },
    {
      key: 'FINANCE',
      title: 'FINANCE & ACCOUNT',
      items: [
        { title: 'Subscription Plan', route: '/vendor/subscription', icon: 'card', color: '#EAB308' },
        { title: 'Vendor Wallet', route: '/vendor/wallet', icon: 'wallet', color: '#10B981' },
        { title: 'Credit Rates', route: '/vendor/rates', icon: 'flash', color: '#38BDF8' },
        { title: 'Store Settings', route: '/vendor/settings', icon: 'settings', color: '#64748B' },
      ],
    },
  ];

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
                  Biz<Text style={{ color: BrandColors.primary }}>Reel</Text>s
                </Text>
                <Text style={styles.brandSubtitle}>VENDOR PORTAL</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Vendor Profile Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{vendorName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName} numberOfLines={1}>{vendorName}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                </View>
              </View>
              <Text style={styles.profileEmail} numberOfLines={1}>{vendorEmail}</Text>
            </View>
          </View>

          {/* Menu Sections Accordion */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {NAV_SECTIONS.map((sec) => {
              const isCollapsed = collapsedSections[sec.key];

              return (
                <View key={sec.key} style={styles.sectionBlock}>
                  {/* Section Title Toggle Header */}
                  <TouchableOpacity
                    style={styles.sectionHeaderRow}
                    onPress={() => toggleSection(sec.key)}>
                    <View style={styles.sectionTitleLeft}>
                      <View style={styles.sectionLine} />
                      <Text style={styles.sectionTitle}>{sec.title}</Text>
                    </View>
                    <Ionicons
                      name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                      size={14}
                      color="rgba(255,255,255,0.4)"
                    />
                  </TouchableOpacity>

                  {/* Section Items */}
                  {!isCollapsed && (
                    <View style={styles.itemsList}>
                      {sec.items.map((item, idx) => {
                        const isActive = pathname === item.route;

                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[styles.menuItemRow, isActive && styles.menuItemRowActive]}
                            onPress={() => handleNavigate(item.route)}>
                            <View style={[styles.iconBox, { backgroundColor: item.color + '1F' }]}>
                              <Ionicons name={item.icon as any} size={16} color={item.color} />
                            </View>

                            <Text style={[styles.menuItemTitle, isActive && styles.menuItemTitleActive]}>
                              {item.title}
                            </Text>

                            {item.badge && (
                              <View style={styles.itemBadge}>
                                <Text style={styles.itemBadgeText}>{item.badge}</Text>
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

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={styles.switchFeedBtn} onPress={() => handleNavigate('/(tabs)/home')}>
              <Ionicons name="swap-horizontal" size={16} color={BrandColors.primary} />
              <Text style={styles.switchFeedText}>Switch to Buyer Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color={BrandColors.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overlay Backdrop Touch */}
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
  },
  backdropTouch: {
    flex: 1,
  },
  drawerContainer: {
    width: '82%',
    maxWidth: 320,
    backgroundColor: '#16171d',
    borderRightWidth: 1,
    borderRightColor: '#282b37',
    paddingHorizontal: Spacing.three,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#252733',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.black },
  brandTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  brandSubtitle: { color: BrandColors.primaryLight, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1 },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#252733',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f212c',
    padding: Spacing.three,
    borderRadius: 14,
    marginVertical: Spacing.two,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2b2e3e',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileName: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold, flex: 1 },
  verifiedBadge: { marginLeft: 2 },
  profileEmail: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },

  scrollContent: { flex: 1 },

  sectionBlock: { marginBottom: 14 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 4,
  },
  sectionTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLine: { width: 3, height: 10, borderRadius: 2, backgroundColor: BrandColors.primary },
  sectionTitle: { color: '#D97706', fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.8 },

  itemsList: { gap: 2 },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
  },
  menuItemRowActive: {
    backgroundColor: '#252836',
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  menuItemTitleActive: {
    color: '#fff',
    fontWeight: FontWeight.bold,
  },
  itemBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemBadgeText: { color: '#10B981', fontSize: 8, fontWeight: FontWeight.bold },

  footer: {
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#252733',
    gap: 8,
  },
  switchFeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222533',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  switchFeedText: { color: BrandColors.primaryLight, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: { color: BrandColors.error, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
