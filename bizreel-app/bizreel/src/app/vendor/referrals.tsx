/**
 * Vendor Refer & Earn Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function VendorReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const code = 'BIZ-VENDOR-882';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn Credits</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎁 Invite Business Partners</Text>
          <Text style={styles.cardDesc}>
            Earn 50 Free Reel Promotion Credits whenever a business owner registers using your code.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{code}</Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => Alert.alert('Copied!', 'Referral code copied to clipboard.')}>
              <Ionicons name="copy-outline" size={16} color="#fff" />
              <Text style={styles.copyBtnText}>Copy Code</Text>
            </TouchableOpacity>
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
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    alignItems: 'center',
  },
  cardTitle: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardDesc: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, textAlign: 'center' },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2b2d36',
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  codeText: { color: BrandColors.primaryLight, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  copyBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
