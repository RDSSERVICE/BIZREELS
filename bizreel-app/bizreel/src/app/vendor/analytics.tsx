/**
 * Vendor Analytics Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function VendorAnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics & Insights</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Reel Views</Text>
            <Text style={styles.statValue}>14.2K</Text>
            <Text style={styles.statSub}>+18% this month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Store Leads</Text>
            <Text style={styles.statValue}>284</Text>
            <Text style={styles.statSub}>+24% conversions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={styles.statValue}>96</Text>
            <Text style={styles.statSub}>₹48,200 revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Store Rating</Text>
            <Text style={styles.statValue}>4.9 ★</Text>
            <Text style={styles.statSub}>From 112 reviews</Text>
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
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  scrollContent: { padding: Spacing.four, gap: Spacing.three },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: {
    width: '48%',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: FontWeight.bold },
  statValue: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.black },
  statSub: { color: BrandColors.primaryLight, fontSize: 10, fontWeight: FontWeight.bold },
});
