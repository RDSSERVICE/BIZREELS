/**
 * Vendor Reviews Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function VendorReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const reviews = [
    { id: '1', customer: 'Amit Kumar', rating: 5, comment: 'Excellent product quality and super fast delivery!', date: '2 days ago' },
    { id: '2', customer: 'Priya Sharma', rating: 5, comment: 'Very professional vendor. Highly recommended!', date: '1 week ago' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Reviews</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.customerName}>{item.customer}</Text>
              <Text style={styles.ratingText}>{'★'.repeat(item.rating)}</Text>
            </View>
            <Text style={styles.comment}>{item.comment}</Text>
            <Text style={styles.date}>{item.date}</Text>
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
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  listContent: { padding: Spacing.four, gap: Spacing.three },
  reviewCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  ratingText: { color: BrandColors.primaryLight, fontSize: FontSize.xs },
  comment: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs },
  date: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 },
});
