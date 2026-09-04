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

import { api } from '@/lib/api';
import { resolveImageUrl, getListingImage } from '@/utils/image';

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
        const { data } = await api.get('/reels/saved');
        const list = data?.data?.reels || data?.reels || data?.data || [];
        setSavedReels(Array.isArray(list) ? list : []);
      } else {
        const { data } = await api.get('/users/me/saved');
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
          <Ionicons name="arrow-back" size={20} color="#fff" />
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
            color={activeTab === 'reels' ? BLACK : 'rgba(255,255,255,0.7)'}
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
            color={activeTab === 'listings' ? BLACK : 'rgba(255,255,255,0.7)'}
          />
          <Text style={[styles.tabText, activeTab === 'listings' && styles.tabTextActive]}>
            Saved Products ({savedListings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={YELLOW} />
          <Text style={styles.loadingText}>
            Loading saved {activeTab === 'reels' ? 'reels' : 'bookmarks'}...
          </Text>
        </View>
      ) : activeTab === 'reels' ? (
        <FlatList
          data={savedReels}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={YELLOW} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={48} color="rgba(255,255,255,0.4)" />
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
                onPress={() => router.push(`/(tabs)?reelId=${id}` as any)}>
                {resolvedThumb ? (
                  <Image source={{ uri: resolvedThumb }} style={styles.gridThumb} contentFit="cover" />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Ionicons name="play" size={24} color={YELLOW} />
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
                  <Ionicons name="bookmark" size={14} color={YELLOW} />
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
          data={savedListings}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={YELLOW} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={48} color="rgba(255,255,255,0.4)" />
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
                    <Ionicons name="bag-handle" size={24} color={YELLOW} />
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
                  <Ionicons name="bookmark" size={18} color={YELLOW} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    backgroundColor: DARK_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: '#141418',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabBtnActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  gridContainer: { padding: 4 },
  gridItem: {
    width: '32.5%',
    height: 160,
    margin: '0.4%',
    backgroundColor: DARK_CARD,
    position: 'relative',
    borderWidth: 1,
    borderColor: BORDER,
  },
  gridThumb: { width: '100%', height: '100%' },
  thumbFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIconBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 4,
    borderRadius: 12,
  },
  overlayInfo: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  overlayText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  listContainer: { padding: 12, gap: 10 },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    gap: 12,
  },
  cardImg: { width: 64, height: 64, borderRadius: 4 },
  cardFallbackImg: {
    width: 64,
    height: 64,
    borderRadius: 4,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: { flex: 1, gap: 2 },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  cardPrice: { color: YELLOW, fontSize: 14, fontWeight: '900' },
  cardVendor: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  cardUnsaveBtn: { padding: 8 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  exploreBtnText: { color: BLACK, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
