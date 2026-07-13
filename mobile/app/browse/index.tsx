import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ListingCard from '@/src/components/ListingCard';
import GradientButton from '@/src/components/GradientButton';
import { categoryApi, listingApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

export default function BrowseIndex() {
  const router = useRouter();
  const [topCats, setTopCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    categoryApi.list({ top_level: true }).then(({ data }) => setTopCats(data.items || [])).catch(() => {});
    fetchListings(true);
  }, []);

  const fetchListings = async (reset = true) => {
    if (reset) setLoading(true);
    try {
      const params: any = { limit: 12 };
      if (q.trim()) params.q = q.trim();
      if (!reset && cursor) params.cursor = cursor;
      const { data } = await listingApi.list(params);
      setItems(prev => reset ? data.items : [...prev, ...data.items]);
      setCursor(data.next_cursor);
      setHasMore(!!data.has_more);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchListings(true); }, [q]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="browse-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Browse</Text>
        <Text style={styles.subtitle}>Discover products and services nearby</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            testID="browse-search-input"
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Search listings..."
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CATEGORIES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {topCats.map(c => (
              <TouchableOpacity key={c.id} testID={`browse-cat-${c.slug}`} onPress={() => router.push(`/browse/${c.slug}`)} style={styles.catChip}>
                <Text style={styles.catText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LISTINGS</Text>
          {loading ? (
            <ActivityIndicator color="#ec4899" style={{ marginTop: 20 }} />
          ) : items.length === 0 ? (
            <View style={styles.emptyWrap} testID="listings-empty">
              <Text style={styles.emptyText}>No listings found</Text>
            </View>
          ) : (
            <>
              <View style={styles.grid} testID="listings-grid">
                {items.map(l => (
                  <View key={l.id} style={styles.gridItem}>
                    <ListingCard listing={l} />
                  </View>
                ))}
              </View>
              {hasMore && (
                <TouchableOpacity testID="load-more-btn" onPress={() => fetchListings(false)} style={styles.loadMoreBtn}>
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
  scrollContent: { paddingBottom: 24 },
  searchWrap: {
    marginHorizontal: 24, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 48, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  section: { paddingHorizontal: 24, marginTop: 20 },
  sectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  catRow: { gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  catText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '48%' },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  loadMoreBtn: {
    marginTop: 16, height: 44, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadMoreText: { fontSize: 14, color: '#fff', fontWeight: '500' },
});
