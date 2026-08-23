/**
 * Vendor Hamburger Side Drawer Modal — Mobile Application
 * Implements the full Vendor Portal navigation matching the design specification.
 */

import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
  const { user } = useAuth();

  const [mainCollapsed, setMainCollapsed] = useState(false);
  const [financeCollapsed, setFinanceCollapsed] = useState(false);

  function handleNavigate(route: string) {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  }

  const mainItems = [
    { title: 'Dashboard', route: '/vendor/dashboard', icon: 'grid-outline' },
    { title: 'My Listings', route: '/vendor/listings', icon: 'cube-outline' },
    { title: 'Reels & AI Ads', route: '/vendor/reels', icon: 'videocam-outline' },
    { title: 'Leads / Enquiries', route: '/inquiries', icon: 'mail-outline' },
    { title: 'Order Requests', route: '/vendor/orders', icon: 'cart-outline' },
    { title: 'Chat / Inbox', route: '/messages', icon: 'chatbubble-ellipses-outline' },
    { title: 'Business Profile', route: '/vendor/settings', icon: 'person-outline' },
    { title: 'Onboarding Details', route: '/vendor/onboarding', icon: 'document-text-outline' },
    { title: 'Verification Center', route: '/vendor/verification', icon: 'shield-checkmark-outline', badge: 'BADGE' },
    { title: 'Analytics', route: '/vendor/analytics', icon: 'analytics-outline' },
    { title: 'Refer & Earn', route: '/vendor/referrals', icon: 'person-add-outline' },
    { title: 'Hire Creator', route: '/vendor/hire-creator', icon: 'people-outline' },
    { title: 'Reviews', route: '/vendor/reviews', icon: 'star-outline' },
    { title: 'Followers', route: '/vendor/followers', icon: 'heart-outline' },
  ];

  const financeItems = [
    { title: 'Subscription', route: '/vendor/subscription', icon: 'card-outline' },
    { title: 'Vendor Wallet', route: '/vendor/wallet', icon: 'wallet-outline' },
    { title: 'Credit Rates', route: '/vendor/rates', icon: 'flash-outline' },
  ];

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.drawerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
          {/* Header */}
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
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ── MAIN SECTION ── */}
            <View style={styles.sectionHeader}>
              <TouchableOpacity
                style={styles.sectionTitleRow}
                onPress={() => setMainCollapsed((v) => !v)}>
                <Text style={styles.sectionTitle}>MAIN</Text>
                <Ionicons
                  name={mainCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={16}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>

            {!mainCollapsed && (
              <View style={styles.menuGroup}>
                {mainItems.map((item, idx) => {
                  const isActive = pathname === item.route;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.menuItem, isActive && styles.menuItemActive]}
                      onPress={() => handleNavigate(item.route)}>
                      <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                        <Ionicons
                          name={item.icon as any}
                          size={18}
                          color={isActive ? BrandColors.primary : '#fff'}
                        />
                      </View>
                      <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                        {item.title}
                      </Text>
                      {item.badge && (
                        <View style={styles.badgePill}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ── FINANCE & ACCOUNT SECTION ── */}
            <View style={styles.sectionHeader}>
              <TouchableOpacity
                style={styles.sectionTitleRow}
                onPress={() => setFinanceCollapsed((v) => !v)}>
                <Text style={styles.sectionTitle}>FINANCE & ACCOUNT</Text>
                <Ionicons
                  name={financeCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={16}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>

            {!financeCollapsed && (
              <View style={styles.menuGroup}>
                {financeItems.map((item, idx) => {
                  const isActive = pathname === item.route;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.menuItem, isActive && styles.menuItemActive]}
                      onPress={() => handleNavigate(item.route)}>
                      <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                        <Ionicons
                          name={item.icon as any}
                          size={18}
                          color={isActive ? BrandColors.primary : '#fff'}
                        />
                      </View>
                      <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  backdrop: {
    width: '20%',
    height: '100%',
  },
  drawerContainer: {
    width: '80%',
    height: '100%',
    backgroundColor: '#16171c',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  sectionHeader: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  menuGroup: {
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#27221d',
    borderWidth: 1,
    borderColor: BrandColors.primary,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: 'rgba(217,119,6,0.15)',
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
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
});
