import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Shadows } from '@/constants/theme';
import { api } from '@/lib/api';
import { getListingImage, resolveImageUrl } from '@/utils/image';

const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_COLOR = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT_MAIN = '#0F172A';
const TEXT_MUTED = '#64748B';

interface SavedReel {
  _id: string;
  id?: string;
  caption?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  mediaUrls?: string[];
  viewsCount?: number;
  likesCount?: number;
  user_id?: { name?: string; avatarUrl?: string };
}

export default function SavedReelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'reels' | 'listings'>('reels');
  const [savedReels, setSavedReels] = useState<SavedReel[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSavedData();
  }, [activeTab]);

  const fetchSavedData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reels') {
        const res = await api
          .get('/reels/saved')
          .catch(() => api.get('/users/me/saved-reels'))
          .catch(() => api.get('/users/me/activities?type=saved-reels'));
        const data = res?.data;
        const list = data?.data?.reels || data?.data || data?.reels || data?.items || [];
        setSavedReels(Array.isArray(list) ? list : []);
      } else {
        const res = await api
          .get('/users/me/saved')
          .catch(() => api.get('/users/me/activities?type=saved-products'));
        const data = res?.data;
        const list = data?.data || data?.savedListings || data?.saved_items || data || [];
        setSavedListings(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.warn('Failed to fetch saved content:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSavedData();
  };

  const handleUnsaveReel = async (reelId: string) => {
    try {
      setSavedReels((prev) => prev.filter((item) => (item._id || item.id) !== reelId));
      await api.post(`/reels/${reelId}/unsave`);
    } catch (err) {
      console.warn('Error unsaving reel:', err);
      fetchSavedData();
    }
  };

  const handleUnsaveListing = async (listingId: string) => {
    try {
      setSavedListings((prev) => prev.filter((item) => (item._id || item.id) !== listingId));
      await api.post(`/listings/${listingId}/unsave`);
    } catch (err) {
      console.warn('Error unsaving listing:', err);
      fetchSavedData();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT_MAIN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MY SAVED REELS & BOOKMARKS</Text>
      </View>

      {/* Tabs Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'reels' && styles.tabBtnActive]}
          onPress={() => setActiveTab('reels')}>
          <Ionicons
            name="film"
            size={14}
            color={activeTab === 'reels' ? GOLD : TEXT_MUTED}
          />
          <Text style={[styles.tabText, activeTab === 'reels' && styles.tabTextActive]}>
            Saved Reels ({savedReels.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'listings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('listings')}>
          <Ionicons
            name="bookmark"
            size={14}
            color={activeTab === 'listings' ? GOLD : TEXT_MUTED}
          />
          <Text style={[styles.tabText, activeTab === 'listings' && styles.tabTextActive]}>
            Saved Products ({savedListings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>
            Loading saved {activeTab === 'reels' ? 'reels' : 'bookmarks'}...
          </Text>
        </View>
      ) : activeTab === 'reels' ? (
        <FlatList
          key="saved-reels-grid-3"
          data={savedReels}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={GOLD} colors={[GOLD]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="bookmark-outline" size={32} color={GOLD} />
              </View>
              <Text style={styles.emptyTitle}>No Saved Reels Yet</Text>
              <Text style={styles.emptySub}>
                Tap the bookmark icon on any Reel in your feed to save it to your personal collection.
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/' as any)}>
                <Text style={styles.exploreBtnText}>EXPLORE REELS FEED</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const id = item._id || item.id || '';
            const rawThumb =
              item.thumbnailUrl ||
              (item as any).thumbnail ||
              item.mediaUrls?.[0] ||
              (item as any).images?.[0] ||
              (item as any).imageUrl ||
              (item as any).videoUrl ||
              (item as any).video_url;
            const resolvedThumb = resolveImageUrl(rawThumb);

            return (
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => router.push({ pathname: '/(tabs)/' as any, params: { reelId: id } })}>
                {resolvedThumb ? (
                  <Image source={{ uri: resolvedThumb }} style={styles.gridThumb} contentFit="cover" />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Ionicons name="play" size={24} color={GOLD} />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.removeIconBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      'Remove Saved Reel',
                      'Are you sure you want to remove this reel from your saved collection?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => handleUnsaveReel(id) },
                      ]
                    );
                  }}>
                  <Ionicons name="bookmark" size={14} color={GOLD} />
                </TouchableOpacity>

                <View style={styles.overlayInfo}>
                  <View style={styles.iconRow}>
                    <Ionicons name="play" size={10} color="#fff" />
                    <Text style={styles.overlayText}>
                      {(item as any).views ?? item.viewsCount ?? (item as any).views_count ?? 0}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          key="saved-listings-list-1"
          data={savedListings}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={GOLD} colors={[GOLD]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="bookmark-outline" size={32} color={GOLD} />
              </View>
              <Text style={styles.emptyTitle}>No Saved Products</Text>
              <Text style={styles.emptySub}>
                Bookmarked products and marketplace items will appear here for quick access.
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/search' as any)}>
                <Text style={styles.exploreBtnText}>BROWSE MARKETPLACE</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const id = item._id || item.id || '';
            const img = getListingImage(item) || resolveImageUrl(item.thumbnailUrl || item.image);

            return (
              <TouchableOpacity
                style={styles.cardItem}
                onPress={() => router.push(`/listing/${id}` as any)}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.cardImg} contentFit="cover" />
                ) : (
                  <View style={styles.cardFallbackImg}>
                    <Ionicons name="bag-handle" size={24} color={GOLD} />
                  </View>
                )}

                <View style={styles.cardDetails}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title || item.name || 'Bookmarked Item'}
                  </Text>
                  <Text style={styles.cardPrice}>
                    ₹{(item.salePrice || item.price || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.cardVendor} numberOfLines={1}>
                    {item.vendor?.name || item.vendorName || item.city || 'Verified Vendor'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.cardUnsaveBtn}
                  onPress={() => handleUnsaveListing(id)}>
                  <Ionicons name="bookmark" size={18} color={GOLD} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: BG_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: {
    color: TEXT_MAIN,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD_BG,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: ESPRESSO,
    borderColor: ESPRESSO,
  },
  tabText: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: GOLD,
    fontWeight: '900',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: TEXT_MUTED, fontSize: 12 },
  gridContainer: { padding: 8 },
  gridItem: {
    width: '32%',
    height: 160,
    margin: '0.66%',
    backgroundColor: CARD_BG,
    position: 'relative',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  gridThumb: { width: '100%', height: '100%' },
  thumbFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: BG_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIconBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(36, 27, 21, 0.75)',
    padding: 5,
    borderRadius: 12,
  },
  overlayInfo: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  overlayText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  listContainer: { padding: 14, gap: 12 },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 14,
    gap: 12,
    ...Shadows.sm,
  },
  cardImg: { width: 64, height: 64, borderRadius: 8 },
  cardFallbackImg: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: BG_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: { flex: 1, gap: 2 },
  cardTitle: { color: TEXT_MAIN, fontSize: 13, fontWeight: '800' },
  cardPrice: { color: GOLD, fontSize: 14, fontWeight: '900' },
  cardVendor: { color: TEXT_MUTED, fontSize: 11 },
  cardUnsaveBtn: { padding: 8 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 154, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.2)',
  },
  emptyTitle: { color: TEXT_MAIN, fontSize: 16, fontWeight: '900' },
  emptySub: {
    color: TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: ESPRESSO,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  exploreBtnText: { color: GOLD, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
