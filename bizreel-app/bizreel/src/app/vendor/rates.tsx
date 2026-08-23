/**
 * Vendor Credit Rates Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function VendorRatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const rates = [
    { title: 'Publish Reel / Image Post', cost: '1 Credit / post' },
    { title: 'Boost Reel to 5,000 Local Buyers', cost: '10 Credits / day' },
    { title: 'Featured Store Spotlight Banner', cost: '25 Credits / week' },
    { title: 'Direct Customer Push Broadcast', cost: '5 Credits / blast' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Credit Rates</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {rates.map((item, idx) => (
          <View key={idx} style={styles.rateCard}>
            <Text style={styles.rateTitle}>{item.title}</Text>
            <Text style={styles.rateCost}>{item.cost}</Text>
          </View>
        ))}
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
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  rateTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  rateCost: { color: BrandColors.primaryLight, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
