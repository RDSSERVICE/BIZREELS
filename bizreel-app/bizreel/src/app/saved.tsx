/**
 * Customer Saved Items & Bookmarks Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { getListingImage } from '@/utils/image';

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = async () => {
    try {
      const { data } = await api.get('/users/me/saved');
      const items = data.data || data.savedListings || data.saved_items || data || [];
      setSavedItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Failed to fetch saved items', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSaved();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Items & Bookmarks</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : savedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={56} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyTitle}>No Saved Items Yet</Text>
          <Text style={styles.emptySub}>
            Bookmarked products and video reels will appear here for quick access later.
          </Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.exploreBtnText}>Browse Marketplace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedItems}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BrandColors.primary}
              colors={[BrandColors.primary]}
            />
          }
          renderItem={({ item }) => {
            const image = getListingImage(item) || item.thumbnailUrl;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  if (item.title) router.push(`/listing/${item._id}`);
                  else router.push('/(tabs)');
                }}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.cardImage} contentFit="cover" />
                ) : (
                  <View style={styles.cardImageFallback}>
                    <Ionicons name="bookmark" size={24} color={BrandColors.primary} />
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title || item.caption || 'Saved Item'}
                  </Text>
                  {item.price && (
                    <Text style={styles.cardPrice}>₹{item.price}</Text>
                  )}
                  <Text style={styles.cardVendor}>
                    {item.vendor?.name || item.creatorName || 'Saved Item'}
                  </Text>
                </View>
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
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BLACK,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 0,
    marginTop: Spacing.two,
  },
  exploreBtnText: {
    color: BLACK,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 0,
  },
  cardImageFallback: {
    width: 90,
    height: 90,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  cardPrice: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  cardVendor: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
});
