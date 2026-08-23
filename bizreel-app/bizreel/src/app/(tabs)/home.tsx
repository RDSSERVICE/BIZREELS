import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSwitcher } from '@/components/role-switcher';
import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAddToCart, useCart } from '@/features/cart/queries';
import { useReelsFeed } from '@/features/reels/queries';
import { api } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.four * 2 - Spacing.three) / 2;

const CATEGORIES: Array<{
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { id: '1', name: 'Electronics', icon: 'laptop-outline', color: '#4A90E2' },
  { id: '2', name: 'Fashion', icon: 'shirt-outline', color: '#E91E63' },
  { id: '3', name: 'Home & Living', icon: 'home-outline', color: '#FF9800' },
  { id: '4', name: 'Vehicles', icon: 'car-outline', color: '#9C27B0' },
  { id: '5', name: 'Real Estate', icon: 'business-outline', color: '#009688' },
  { id: '6', name: 'Beauty & Salon', icon: 'sparkles-outline', color: '#EC407A' },
  { id: '7', name: 'Digital Services', icon: 'flash-outline', color: '#00BCD4' },
  { id: '8', name: 'Corporate Gifts', icon: 'gift-outline', color: '#795548' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: cart } = useCart();
  const addToCartMutation = useAddToCart();
  const { data: reelsData } = useReelsFeed();

  const reels = reelsData?.pages?.flatMap((p) => p.data || []) || [];
  const cartItemCount = cart?.total_items || 0;

  const fetchHomeData = async () => {
    try {
      const { data } = await api.get('/listings', { params: { limit: 20 } });
      const items = data.data || data.items || data || [];
      setListings(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Failed to load listings', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch = searchQuery
      ? item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory
      ? item.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>BIZ<Text style={styles.brandAccent}>REELS</Text></Text>
        </View>

        <View style={styles.headerRightGroup}>
          <RoleSwitcher />
          <TouchableOpacity
            style={styles.cartIconBtn}
            onPress={() => router.push('/cart')}
            accessibilityLabel="Cart">
            <Ionicons name="cart" size={20} color="#fff" />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandColors.primary}
            colors={[BrandColors.primary]}
          />
        }>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, services & verified sellers..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Promotional Card Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Ionicons name="flame" size={14} color={BrandColors.primary} />
              <Text style={styles.heroTagText}>TRENDING MARKETPLACE</Text>
            </View>
            <Text style={styles.heroTitle}>Discover & Buy Directly from Sellers</Text>
            <Text style={styles.heroSub}>Watch short reels to preview products in action</Text>
            <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/(tabs)')}>
              <Ionicons name="play" size={14} color="#fff" />
              <Text style={styles.heroBtnText}>Watch Reels Feed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Horizontal Selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
                onPress={() => setSelectedCategory(isSelected ? null : cat.name)}>
                <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon} size={22} color={cat.color} />
                </View>
                <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Watch Featured Reels Highlights */}
        {reels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Video Reels</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)')}>
                <Text style={styles.seeAllText}>View All ›</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reelsHighlightScroll}>
              {reels.slice(0, 6).map((reel) => (
                <TouchableOpacity
                  key={reel._id}
                  style={styles.reelHighlightCard}
                  onPress={() => router.push({ pathname: '/(tabs)', params: { reelId: reel._id } })}>
                  <Image
                    source={{ uri: reel.thumbnailUrl || reel.mediaUrls?.[0] }}
                    style={styles.reelThumbnail}
                    contentFit="cover"
                  />
                  <View style={styles.reelOverlayGradient} />
                  <View style={styles.reelPlayBadge}>
                    <Ionicons name="play" size={14} color="#fff" />
                  </View>
                  <Text style={styles.reelCaption} numberOfLines={2}>
                    {reel.caption || reel.creatorName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trending Listings Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? `${selectedCategory} (${filteredListings.length})` : 'Trending Products & Services'}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={BrandColors.primary} style={{ marginVertical: 40 }} />
          ) : filteredListings.length === 0 ? (
            <View style={styles.emptyListings}>
              <Ionicons name="basket-outline" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyListingsText}>No products found matching your search</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredListings.map((item) => {
                const imageUrl = item.images?.[0]?.url || item.image || item.serviceDetails?.coverImage;
                const price = item.salePrice || item.sellingPrice || item.price || 0;
                const originalPrice = item.actualPrice || item.price;

                return (
                  <TouchableOpacity
                    key={item._id || item.id}
                    style={styles.productCard}
                    onPress={() => router.push(`/listing/${item._id || item.id}`)}>
                    {/* Card Thumbnail */}
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.productImage} contentFit="cover" />
                    ) : (
                      <View style={styles.productImageFallback}>
                        <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.4)" />
                      </View>
                    )}

                    {/* Content Details */}
                    <View style={styles.productInfo}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {item.title}
                      </Text>

                      <Text style={styles.vendorName} numberOfLines={1}>
                        {item.vendor?.businessName || item.vendor?.name || 'Verified Vendor'}
                      </Text>

                      <View style={styles.priceRow}>
                        <View>
                          <Text style={styles.productPrice}>₹{price}</Text>
                          {originalPrice > price && (
                            <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                          )}
                        </View>

                        <TouchableOpacity
                          style={styles.addCartBtn}
                          onPress={() =>
                            addToCartMutation.mutate({ listing_id: item._id || item.id, quantity: 1 })
                          }
                          disabled={addToCartMutation.isPending}>
                          <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  brandTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  brandAccent: {
    color: BrandColors.primary,
  },
  cartIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: BrandColors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: Spacing.four,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.sm,
  },
  heroBanner: {
    marginHorizontal: Spacing.four,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BrandColors.primary + '50',
    overflow: 'hidden',
  },
  heroContent: {
    gap: Spacing.two,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.3)',
  },
  heroTagText: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  heroTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    lineHeight: 24,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  heroBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  seeAllText: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  clearFilterText: {
    color: BrandColors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  categoryCard: {
    alignItems: 'center',
    width: 80,
    gap: Spacing.one,
  },
  categoryCardSelected: {
    opacity: 1,
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  categoryName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  categoryNameSelected: {
    color: BrandColors.primaryLight,
    fontWeight: FontWeight.bold,
  },
  reelsHighlightScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  reelHighlightCard: {
    width: 120,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    justifyContent: 'flex-end',
    padding: Spacing.two,
  },
  reelThumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  reelOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  reelPlayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelCaption: {
    color: '#fff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 3,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  productImageFallback: {
    width: '100%',
    height: 140,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: Spacing.two,
    gap: 4,
  },
  productTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    lineHeight: 16,
  },
  vendorName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  productPrice: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  originalPrice: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  addCartBtn: {
    backgroundColor: BrandColors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListings: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.two,
  },
  emptyListingsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.sm,
  },
});
