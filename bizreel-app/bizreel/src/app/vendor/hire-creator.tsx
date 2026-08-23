/**
 * Vendor Hire Creator Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function VendorHireCreatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const creators = [
    { id: '1', name: 'Rohan Sharma', category: 'Tech & Electronics', rating: 4.9, reels: 42, rate: '₹1,500/reel' },
    { id: '2', name: 'Ananya Verma', category: 'Fashion & Lifestyle', rating: 4.8, reels: 88, rate: '₹2,000/reel' },
    { id: '3', name: 'Vikram Singh', category: 'Food & Restaurants', rating: 5.0, reels: 65, rate: '₹1,800/reel' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hire Content Creators</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={creators}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.creatorCard}>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{item.name}</Text>
              <Text style={styles.creatorCat}>{item.category} • {item.reels} Reels</Text>
              <Text style={styles.creatorRating}>★ {item.rating} Rating</Text>
            </View>
            <View style={styles.creatorRight}>
              <Text style={styles.creatorRate}>{item.rate}</Text>
              <TouchableOpacity
                style={styles.hireBtn}
                onPress={() => Alert.alert('Hire Request', `Sent project proposal to ${item.name}`)}>
                <Text style={styles.hireBtnText}>Hire Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
  listContent: { padding: Spacing.four, gap: Spacing.three },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  creatorInfo: { gap: 2 },
  creatorName: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  creatorCat: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  creatorRating: { color: BrandColors.primaryLight, fontSize: 10, fontWeight: FontWeight.bold },
  creatorRight: { alignItems: 'flex-end', gap: 6 },
  creatorRate: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  hireBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 14,
  },
  hireBtnText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },
});
