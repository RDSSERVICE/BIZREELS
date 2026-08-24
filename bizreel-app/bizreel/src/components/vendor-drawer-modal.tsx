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
        { title: 'Dashboard', route: '/vendor/dashboard', icon: 'grid-outline' },
        { title: 'My Listings', route: '/vendor/listings', icon: 'cube-outline' },
        { title: 'Reels & AI Ads', route: '/vendor/reels', icon: 'videocam-outline' },
        { title: 'Leads / Enquiries', route: '/inquiries', icon: 'mail-outline' },
        { title: 'Order Requests', route: '/vendor/orders', icon: 'cart-outline' },
        { title: 'Chat / Inbox', route: '/messages', icon: 'chatbubble-ellipses-outline' },
      ],
    },
    {
      key: 'PORTALS',
      title: 'PORTALS & FEEDS',
      items: [
        { title: 'Customer Feed', route: '/(tabs)/home', icon: 'tv-outline' },
        { title: 'Creator Portal', route: '/vendor/hire-creator', icon: 'film-outline' },
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
        { title: 'Refer & Earn', route: '/vendor/referrals', icon: 'person-add-outline' },
        { title: 'Hire Creator', route: '/vendor/hire-creator', icon: 'people-outline' },
        { title: 'Reviews', route: '/vendor/reviews', icon: 'star-outline' },
        { title: 'Followers', route: '/vendor/followers', icon: 'heart-outline' },
      ],
    },
    {
      key: 'FINANCE',
      title: 'FINANCE & ACCOUNT',
      items: [
        { title: 'Subscription Plan', route: '/vendor/subscription', icon: 'card-outline' },
        { title: 'Vendor Wallet', route: '/vendor/wallet', icon: 'wallet-outline' },
        { title: 'Credit Rates', route: '/vendor/rates', icon: 'flash-outline' },
        { title: 'Store Settings', route: '/vendor/settings', icon: 'settings-outline' },
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
                  Biz<Text style={{ color: '#F59E0B' }}>Reel</Text>s
                </Text>
                <Text style={styles.brandSubtitle}>VENDOR PORTAL</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#F59E0B" />
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
                  <Ionicons name="checkmark-circle" size={12} color="#F59E0B" />
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
                      color="#F59E0B"
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
                            <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                              <Ionicons
                                name={item.icon as any}
                                size={16}
                                color={isActive ? '#000' : '#F59E0B'}
                              />
                            </View>

                            <Text style={[styles.menuItemTitle, isActive && styles.menuItemTitleActive]}>
                              {item.title}
                            </Text>

                            {item.badge && (
                              <View style={[styles.itemBadge, isActive && styles.itemBadgeActive]}>
                                <Text style={[styles.itemBadgeText, isActive && styles.itemBadgeTextActive]}>
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

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={styles.switchFeedBtn} onPress={() => handleNavigate('/(tabs)/home')}>
              <Ionicons name="swap-horizontal" size={16} color="#F59E0B" />
              <Text style={styles.switchFeedText}>Switch to Buyer Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    flexDirection: 'row',
  },
  backdropTouch: { flex: 1 },
  drawerContainer: {
    width: '70%',
    maxWidth: 270,
    backgroundColor: '#0F0F12',
    borderRightWidth: 2,
    borderRightColor: '#F59E0B',
    paddingHorizontal: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#26262E',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 0,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#000', fontSize: FontSize.md, fontWeight: '900' },
  brandTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  brandSubtitle: { color: '#F59E0B', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },

  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 0,
    backgroundColor: '#1C1C22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    padding: 8,
    borderRadius: 0,
    marginVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 0,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#000', fontSize: FontSize.sm, fontWeight: '900' },
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
  sectionLine: { width: 3, height: 10, borderRadius: 1, backgroundColor: '#F59E0B' },
  sectionTitle: { color: '#F59E0B', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  itemsList: { gap: 3 },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 0,
    gap: 8,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E26',
  },
  menuItemRowActive: {
    backgroundColor: '#F59E0B',
    borderBottomColor: '#F59E0B',
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 0,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: '#000',
    borderWidth: 0,
  },
  menuItemTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  menuItemTitleActive: {
    color: '#000',
    fontWeight: '900',
  },
  itemBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  itemBadgeActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  itemBadgeText: { color: '#F59E0B', fontSize: 8, fontWeight: '900' },
  itemBadgeTextActive: { color: '#F59E0B' },

  footer: {
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#26262E',
    gap: 8,
  },
  switchFeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181C',
    paddingVertical: 8,
    borderRadius: 0,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  switchFeedText: { color: '#F59E0B', fontSize: FontSize.xs, fontWeight: '900' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 8,
    borderRadius: 0,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  logoutText: { color: '#EF4444', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
