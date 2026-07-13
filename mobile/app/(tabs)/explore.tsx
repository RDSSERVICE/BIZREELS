import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ListingCard from '@/src/components/ListingCard';
import ScreenHeader from '@/src/components/ScreenHeader';
import { categoryApi, listingApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

export default function Explore() {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.list({ top_level: true }).then(({ data }) => setCats(data.items || [])).catch(() => {});
    listingApi.list({ limit: 30 }).then(({ data }) => { setItems(data.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const renderCat = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`cat-${item.slug}`}
      style={styles.catChip}
      onPress={() => router.push(`/browse/${item.slug}`)}
    >
      <Text style={styles.catText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Explore" subtitle="Browse everything, filtered your way." />

      {/* Search bar */}
      <TouchableOpacity
        testID="explore-search-btn"
        onPress={() => router.push('/search')}
        style={styles.searchBar}
      >
        <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
        <Text style={styles.searchPlaceholder}>Search listings, vendors...</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CATEGORIES</Text>
          <FlatList
            data={cats}
            keyExtractor={(c) => c.id}
            renderItem={renderCat}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catList}
          />
        </View>

        {/* Trending */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRENDING NOW</Text>
          {loading ? (
            <ActivityIndicator color="#ec4899" style={{ marginTop: 20 }} />
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nothing here yet.</Text>
            </View>
          ) : (
            <View style={styles.grid} testID="explore-listings">
              {items.map((l) => (
                <View key={l.id} style={styles.gridItem}>
                  <ListingCard listing={l} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  searchBar: {
    marginHorizontal: 24, height: 48, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8,
  },
  searchPlaceholder: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  scrollContent: { paddingBottom: 24 },
  section: { paddingHorizontal: 24, marginTop: 20 },
  sectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  catList: { gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  catText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '48%' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});
