/**
 * Profile Screen — Minimalistic & Professional User & Vendor Profile.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  if (isError || !user) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={BrandColors.error} />
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

  const ratingDisplay = user.rating_count > 0 ? `${user.rating_avg.toFixed(1)} ★` : '4.9 ★';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* App Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={BrandColors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={BrandColors.primary}
            colors={[BrandColors.primary]}
          />
        }>
        {/* ── User Header Banner Card ── */}
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
              <Ionicons name="checkmark" size={10} color="#fff" />
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

        {/* ── Quick Metrics Stat Strip ── */}
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

        {/* ── Vendor Management Menu Options ── */}
        {user.activeRole === 'vendor' && (
          <View style={styles.menuSectionCard}>
            <Text style={styles.menuSectionHeader}>VENDOR MANAGEMENT</Text>

            {[
              { label: 'Store Dashboard & Analytics', route: '/vendor/dashboard', icon: 'grid-outline', color: '#38BDF8' },
              { label: 'Video Reels & AI Ads', route: '/vendor/reels', icon: 'videocam-outline', color: '#EC4899' },
              { label: 'Product & Service Catalog', route: '/vendor/listings', icon: 'cube-outline', color: '#F59E0B' },
              { label: 'Customer Orders & Requests', route: '/vendor/orders', icon: 'cart-outline', color: '#10B981' },
              { label: 'Chat & Inbox Messages', route: '/messages', icon: 'chatbubble-ellipses-outline', color: '#6366F1' },
              { label: 'KYC Business Verification', route: '/vendor/verification', icon: 'shield-checkmark-outline', color: '#10B981' },
              { label: 'Store Settings & Operations', route: '/vendor/settings', icon: 'options-outline', color: '#3B82F6' },
            ].map((menu, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.menuRow}
                onPress={() => router.push(menu.route as any)}>
                <View style={[styles.menuIconBox, { backgroundColor: menu.color + '1A' }]}>
                  <Ionicons name={menu.icon as any} size={18} color={menu.color} />
                </View>
                <Text style={styles.menuLabel}>{menu.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Finance & Account Settings ── */}
        <View style={styles.menuSectionCard}>
          <Text style={styles.menuSectionHeader}>FINANCE & ACCOUNT PREFERENCES</Text>

          {[
            { label: 'Subscription & Billing', route: '/vendor/subscription', icon: 'card-outline', color: '#EAB308' },
            { label: 'Vendor Wallet & Credits', route: '/vendor/wallet', icon: 'wallet-outline', color: '#10B981' },
            { label: 'Credit Rate Schedule', route: '/vendor/rates', icon: 'flash-outline', color: '#38BDF8' },
            { label: 'Refer & Earn Rewards', route: '/vendor/referrals', icon: 'person-add-outline', color: '#EAB308' },
          ].map((menu, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuRow}
              onPress={() => router.push(menu.route as any)}>
              <View style={[styles.menuIconBox, { backgroundColor: menu.color + '1A' }]}>
                <Ionicons name={menu.icon as any} size={18} color={menu.color} />
              </View>
              <Text style={styles.menuLabel}>{menu.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Log Out Button ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={BrandColors.error} />
          <Text style={styles.logoutBtnText}>Log Out of Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212' },
  errorText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.sm, marginTop: 8 },
  retryBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  retryText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { padding: Spacing.four, gap: Spacing.four },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1c24',
    padding: Spacing.four,
    borderRadius: 20,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#292c3a',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  verifiedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BrandColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a1c24',
  },

  userInfoCol: { flex: 1, gap: 4 },
  nameRoleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userName: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold, flex: 1, marginRight: 6 },
  userEmail: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  badgePillsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  kycDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  kycText: { color: '#10B981', fontSize: 9, fontWeight: FontWeight.bold },
  planBadge: {
    backgroundColor: 'rgba(217,119,6,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  planText: { color: '#D97706', fontSize: 9, fontWeight: FontWeight.bold },

  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1c24',
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292c3a',
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },

  menuSectionCard: {
    backgroundColor: '#1a1c24',
    borderRadius: 20,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
    borderColor: '#292c3a',
    gap: 2,
  },
  menuSectionHeader: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
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
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginTop: Spacing.two,
  },
  logoutBtnText: { color: BrandColors.error, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
