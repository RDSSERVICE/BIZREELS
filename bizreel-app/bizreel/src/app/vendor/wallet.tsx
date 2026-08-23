/**
 * Vendor Wallet Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function VendorWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Wallet & Balance</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Available Wallet Credits</Text>
          <Text style={styles.balance}>250 Credits</Text>
          <Text style={styles.rupeeValue}>≈ ₹2,500 Promotion Value</Text>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => Alert.alert('Add Credits', 'Redirecting to Razorpay checkout...')}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add More Credits</Text>
          </TouchableOpacity>
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
  walletCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    alignItems: 'center',
  },
  walletLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  balance: { color: BrandColors.primaryLight, fontSize: 32, fontWeight: FontWeight.black },
  rupeeValue: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 6,
    marginTop: Spacing.two,
  },
  addBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
