import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/lib/api';

interface SavedReel {
  _id: string;
  caption?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  viewsCount?: number;
  likesCount?: number;
  user_id?: { name?: string; avatarUrl?: string };
}

export default function SavedReelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [savedReels, setSavedReels] = useState<SavedReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSavedReels();
  }, []);

  const fetchSavedReels = async () => {
    try {
      const { data } = await api.get('/reels/saved');
      const list = data?.data?.reels || data?.reels || data?.data || [];
      setSavedReels(list);
    } catch (err) {
      console.warn('Failed to fetch saved reels', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSavedReels();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MY SAVED REELS & POSTS</Text>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={YELLOW} />
          <Text style={styles.loadingText}>Loading your bookmarked reels...</Text>
        </View>
      ) : (
        <FlatList
          data={savedReels}
          keyExtractor={(item) => item._id}
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
                Tap the bookmark icon on any Reel to save it to your personal collection.
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/' as any)}>
                <Text style={styles.exploreBtnText}>EXPLORE REELS FEED</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push(`/(tabs)?reelId=${item._id}` as any)}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.gridThumb} contentFit="cover" />
              ) : (
                <View style={styles.thumbFallback}>
                  <Ionicons name="play" size={24} color={YELLOW} />
                </View>
              )}

              <View style={styles.overlayInfo}>
                <View style={styles.iconRow}>
                  <Ionicons name="play" size={10} color="#fff" />
                  <Text style={styles.overlayText}>{item.viewsCount || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
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
