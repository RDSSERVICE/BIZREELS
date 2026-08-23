/**
 * Vendor Onboarding Details Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';

export default function VendorOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const vendor = user?.vendorProfile || {};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Onboarding Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏢 Business Identity</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Business Name</Text>
            <Text style={styles.value}>{vendor.storeName || vendor.businessName || user?.name || 'My Store'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Primary Category</Text>
            <Text style={styles.value}>{vendor.category || vendor.businessCategory || 'Products'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Subcategory</Text>
            <Text style={styles.value}>{vendor.subcategory || 'General'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Location & Reach</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Store Address</Text>
            <Text style={styles.value}>{vendor.address || 'Bengaluru, India'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Promotion Radius</Text>
            <Text style={styles.value}>{vendor.promotionArea || 'Within 5 KM'}</Text>
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
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  cardTitle: { color: BrandColors.primaryLight, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs },
  value: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
