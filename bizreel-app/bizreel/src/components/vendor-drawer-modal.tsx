/**
 * Vendor Hamburger Side Drawer Modal — Mobile Application
 * Implements a modern, high-aesthetic Vendor Portal side drawer menu.
 */

import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
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

  const [mainCollapsed, setMainCollapsed] = useState(false);
  const [financeCollapsed, setFinanceCollapsed] = useState(false);

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

  function handleSwitchCustomer() {
    onClose();
    router.push('/(tabs)/home');
  }

  const vendorName = (user as any)?.vendorProfile?.storeName || (user as any)?.vendorProfile?.businessName || user?.name || 'Vendor Store';
  const vendorEmail = user?.email || 'vendor@bizreels.com';

  const mainItems = [
    { title: 'Dashboard', route: '/vendor/dashboard', icon: 'grid', color: '#38BDF8' },
    { title: 'My Listings', route: '/vendor/listings', icon: 'cube', color: '#F59E0B' },
    { title: 'Reels & AI Ads', route: '/vendor/reels', icon: 'videocam', color: '#EC4899' },
    { title: 'Leads / Enquiries', route: '/inquiries', icon: 'mail', color: '#8B5CF6' },
    { title: 'Order Requests', route: '/vendor/orders', icon: 'cart', color: '#10B981' },
    { title: 'Chat / Inbox', route: '/messages', icon: 'chatbubble-ellipses', color: '#6366F1' },
    { title: 'Business Profile', route: '/vendor/settings', icon: 'person', color: '#3B82F6' },
    { title: 'Onboarding Details', route: '/vendor/onboarding', icon: 'document-text', color: '#14B8A6' },
    { title: 'Verification Center', route: '/vendor/verification', icon: 'shield-checkmark', color: '#10B981', badge: 'VERIFIED' },
    { title: 'Analytics', route: '/vendor/analytics', icon: 'analytics', color: '#F43F5E' },
    { title: 'Refer & Earn', route: '/vendor/referrals', icon: 'person-add', color: '#EAB308' },
    { title: 'Hire Creator', route: '/vendor/hire-creator', icon: 'people', color: '#A855F7' },
    { title: 'Reviews', route: '/vendor/reviews', icon: 'star', color: '#F59E0B' },
    { title: 'Followers', route: '/vendor/followers', icon: 'heart', color: '#EC4899' },
  ];

  const financeItems = [
    { title: 'Subscription Plan', route: '/vendor/subscription', icon: 'card', color: '#EAB308' },
    { title: 'Vendor Wallet', route: '/vendor/wallet', icon: 'wallet', color: '#10B981' },
    { title: 'Credit Rates', route: '/vendor/rates', icon: 'flash', color: '#38BDF8' },
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

          {/* Vendor Profile Info Box */}
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

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ── MAIN SECTION ── */}
            <TouchableOpacity
              style={styles.sectionHeaderRow}
              onPress={() => setMainCollapsed((v) => !v)}>
              <View style={styles.sectionTitleLeft}>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionTitle}>MAIN NAVIGATION</Text>
              </View>
              <Ionicons
                name={mainCollapsed ? 'chevron-down' : 'chevron-up'}
                size={16}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>

            {!mainCollapsed && (
              <View style={styles.menuGroup}>
                {mainItems.map((item, idx) => {
                  const isActive = pathname === item.route;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.menuItem, isActive && styles.menuItemActive]}
                      onPress={() => handleNavigate(item.route)}>
                      <View style={[styles.iconBox, { backgroundColor: item.color + '1A' }, isActive && { backgroundColor: item.color }]}>
                        <Ionicons
                          name={(isActive ? item.icon : `${item.icon}-outline`) as any}
                          size={18}
                          color={isActive ? '#fff' : item.color}
                        />
                      </View>

                      <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                        {item.title}
                      </Text>

                      {item.badge ? (
                        <View style={styles.badgePill}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={14} color={isActive ? BrandColors.primary : 'rgba(255,255,255,0.2)'} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ── FINANCE & ACCOUNT SECTION ── */}
            <TouchableOpacity
              style={[styles.sectionHeaderRow, { marginTop: Spacing.four }]}
              onPress={() => setFinanceCollapsed((v) => !v)}>
              <View style={styles.sectionTitleLeft}>
                <View style={[styles.sectionLine, { backgroundColor: '#10B981' }]} />
                <Text style={styles.sectionTitle}>FINANCE & ACCOUNT</Text>
              </View>
              <Ionicons
                name={financeCollapsed ? 'chevron-down' : 'chevron-up'}
                size={16}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>

            {!financeCollapsed && (
              <View style={styles.menuGroup}>
                {financeItems.map((item, idx) => {
                  const isActive = pathname === item.route;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.menuItem, isActive && styles.menuItemActive]}
                      onPress={() => handleNavigate(item.route)}>
                      <View style={[styles.iconBox, { backgroundColor: item.color + '1A' }, isActive && { backgroundColor: item.color }]}>
                        <Ionicons
                          name={(isActive ? item.icon : `${item.icon}-outline`) as any}
                          size={18}
                          color={isActive ? '#fff' : item.color}
                        />
                      </View>

                      <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                        {item.title}
                      </Text>

                      <Ionicons name="chevron-forward" size={14} color={isActive ? BrandColors.primary : 'rgba(255,255,255,0.2)'} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Drawer Footer Actions */}
            <View style={styles.footerContainer}>
              <TouchableOpacity style={styles.switchRoleBtn} onPress={handleSwitchCustomer}>
                <Ionicons name="swap-horizontal" size={16} color={BrandColors.primaryLight} />
                <Text style={styles.switchRoleText}>Switch to Buyer Feed</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={16} color={BrandColors.error} />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: insets.bottom + 20 }} />
          </ScrollView>
        </View>

        {/* Backdrop Right */}
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  drawerContainer: {
    width: '82%',
    height: '100%',
    backgroundColor: '#14151a',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  backdrop: {
    width: '18%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  brandSubtitle: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d1f27',
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.3)',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  verifiedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 6,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLine: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: BrandColors.primary,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },

  menuGroup: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: '#27221d',
    borderWidth: 1,
    borderColor: BrandColors.primary,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  menuTextActive: {
    color: '#D97706',
    fontWeight: FontWeight.bold,
  },
  badgePill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: FontWeight.bold,
  },

  footerContainer: {
    marginTop: Spacing.five,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: Spacing.two,
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20232d',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  switchRoleText: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: {
    color: BrandColors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
});
