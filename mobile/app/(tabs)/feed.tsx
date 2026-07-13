import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import ListingCard from '@/src/components/ListingCard';
import { feedApi, resolveMediaUrl } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

export default function Feed() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    try {
      const params: any = { limit: 20 };
      if (!reset && cursor) params.cursor = cursor;
      const { data } = await feedApi.main(params);
      setItems((prev) => reset ? data.items : [...prev, ...data.items]);
      setCursor(data.next_cursor);
      setHasMore(!!data.has_more);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cursor]);

  useEffect(() => { load(true); }, []);

  const onRefresh = () => { setRefreshing(true); load(true); };

  // Separate reels and grid items
  const reels = items.filter(i => i.reel?.url);
  const gridItems = items.filter(i => !i.reel?.url);

  const sections: any[] = [];
  let reelIdx = 0;
  let gridIdx = 0;

  // Interleave: 3 reels then 1 grid row of 2
  while (reelIdx < reels.length || gridIdx < gridItems.length) {
    for (let i = 0; i < 3 && reelIdx < reels.length; i++) {
      sections.push({ type: 'reel', data: reels[reelIdx++] });
    }
    if (gridIdx < gridItems.length) {
      const row = gridItems.slice(gridIdx, gridIdx + 2);
      sections.push({ type: 'grid', data: row });
      gridIdx += 2;
    }
  }

  const renderSection = ({ item }: { item: any }) => {
    if (item.type === 'reel') {
      const reel = item.data;
      return (
        <TouchableOpacity
          testID={`reel-${reel.id}`}
          style={styles.reelCard}
          onPress={() => router.push(`/listing/${reel.slug}`)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: resolveMediaUrl(reel.images?.[0]?.url) }} style={styles.reelImage} contentFit="cover" />
          <View style={styles.reelOverlay}>
            <View style={styles.reelInfo}>
              <Text style={styles.reelTitle} numberOfLines={2}>{reel.title}</Text>
              <Text style={styles.reelPrice}>
                ₹{new Intl.NumberFormat('en-IN').format(reel.offer_price || reel.price)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    // Grid row
    return (
      <View style={styles.gridRow}>
        <Text style={styles.gridLabel}>Popular around you</Text>
        <View style={styles.gridCols}>
          {item.data.map((l: any) => (
            <View key={l.id} style={styles.gridCol}>
              <ListingCard listing={l} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity
          testID="feed-search-btn"
          onPress={() => router.push('/search')}
          style={styles.searchBtn}
        >
          <Ionicons name="search" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.loadingWrap} testID="feed-loading">
          <ActivityIndicator color="#ec4899" size="large" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap} testID="feed-empty">
          <Text style={styles.emptyText}>No listings in your area yet</Text>
        </View>
      ) : (
        <FlatList
          testID="feed-scroll"
          data={sections}
          keyExtractor={(item, i) => `${item.type}-${i}`}
          renderItem={renderSection}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ec4899" />}
          onEndReached={() => hasMore && load(false)}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  searchBtn: {
    height: 40, width: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingBottom: 16 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center' },
  reelCard: {
    marginHorizontal: 16, marginVertical: 6,
    borderRadius: borderRadius.xl, overflow: 'hidden',
    height: 420, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  reelImage: { width: '100%', height: '100%' },
  reelOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingTop: 60,
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  reelInfo: { flex: 1 },
  reelTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  reelPrice: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 4 },
  reelActions: { alignItems: 'center', gap: 2 },
  reelCount: { fontSize: 11, color: '#fff', fontWeight: '600' },
  gridRow: { paddingHorizontal: 16, paddingVertical: 12 },
  gridLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600', marginBottom: 8 },
  gridCols: { flexDirection: 'row', gap: 8 },
  gridCol: { flex: 1 },
});
