/**
 * Vendor Subscription Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function VendorSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plan</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.activeCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.planName}>PRO VENDOR PLAN</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>

          <Text style={styles.price}>₹999 / month</Text>
          <Text style={styles.renews}>Renews on Sep 23, 2026</Text>

          <View style={styles.featureList}>
            <Text style={styles.feature}>✓ Unlimited Video Reel Uploads</Text>
            <Text style={styles.feature}>✓ Priority Search Listing Placement</Text>
            <Text style={styles.feature}>✓ 50 Free Monthly Promotion Credits</Text>
            <Text style={styles.feature}>✓ Verified Gold Vendor Shield Badge</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justify.content: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  scrollContent: { padding: Spacing.four, gap: Spacing.three },
  activeCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { color: BrandColors.primaryLight, fontSize: FontSize.sm, fontWeight: FontWeight.black },
  activeBadge: { backgroundColor: BrandColors.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeBadgeText: { color: '#fff', fontSize: 9, fontWeight: FontWeight.bold },
  price: { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.black, marginTop: 4 },
  renews: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  featureList: { gap: 6, marginTop: Spacing.two },
  feature: { color: 'rgba(255,255,255,0.9)', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
